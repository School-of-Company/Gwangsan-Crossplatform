import axios, { AxiosError } from 'axios';

const KAKAO_LOCAL_SEARCH_PATH = '/v2/local/search/keyword.json';
const KAKAO_LOCAL_CATEGORY_PATH = '/v2/local/search/category.json';
const KAKAO_COORD2ADDRESS_PATH = '/v2/local/geo/coord2address.json';

// raw fetch는 타임아웃이 없어 네트워크가 느리면 검색 화면이 로딩 상태로 멈췄다(#739)
export const kakaoClient = axios.create({
  baseURL: 'https://dapi.kakao.com',
  timeout: 10_000,
});

// 만남 장소 기준으로 삼기 좋은 카테고리: 지하철역, 편의점, 카페, 은행
const NEARBY_CATEGORY_GROUP_CODES = ['SW8', 'CS2', 'CE7', 'BK9'] as const;

export interface KakaoPlace {
  readonly id: string;
  readonly place_name: string;
  readonly category_name: string;
  readonly address_name: string;
  readonly road_address_name: string;
  readonly x: string; // 경도(longitude)
  readonly y: string; // 위도(latitude)
  readonly distance?: string; // 중심 좌표로부터의 거리(m), 좌표 기반 검색일 때만 존재
}

interface KakaoLocalSearchResponse {
  readonly documents: KakaoPlace[];
}

interface Coordinate {
  readonly latitude: number;
  readonly longitude: number;
}

interface KakaoCoord2AddressResponse {
  readonly documents: readonly {
    readonly address: { readonly address_name: string } | null;
    readonly road_address: { readonly address_name: string } | null;
  }[];
}

const getKakaoApiKey = (): string => {
  const apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error('카카오 API 키가 설정되지 않았습니다.');
  }
  return apiKey;
};

const authHeaders = () => ({ Authorization: `KakaoAK ${getKakaoApiKey()}` });

// 응답을 받았지만 실패한 경우(4xx/5xx)는 상태 코드를 담은 안내 문구로 바꾸고, 네트워크·타임아웃 오류는
// 그대로 던진다
const toKakaoError = (error: unknown, label: string): Error => {
  if (error instanceof AxiosError && error.response) {
    return new Error(`${label} 요청이 실패했습니다. (${error.response.status})`);
  }
  return error instanceof Error ? error : new Error(`${label} 요청이 실패했습니다.`);
};

export const searchPlaces = async (query: string): Promise<KakaoPlace[]> => {
  const headers = authHeaders();
  try {
    const { data } = await kakaoClient.get<KakaoLocalSearchResponse>(KAKAO_LOCAL_SEARCH_PATH, {
      params: { query },
      headers,
    });
    return data.documents;
  } catch (error) {
    throw toKakaoError(error, '장소 검색');
  }
};

// 좌표 주변의 지하철역/편의점/카페/은행을 거리순으로 검색해 병합한다.
export const searchNearbyPlaces = async (
  coordinate: Coordinate,
  radius: number
): Promise<KakaoPlace[]> => {
  const headers = authHeaders();

  const results = await Promise.all(
    NEARBY_CATEGORY_GROUP_CODES.map(async (categoryGroupCode) => {
      try {
        const { data } = await kakaoClient.get<KakaoLocalSearchResponse>(
          KAKAO_LOCAL_CATEGORY_PATH,
          {
            params: {
              category_group_code: categoryGroupCode,
              x: String(coordinate.longitude),
              y: String(coordinate.latitude),
              radius: String(radius),
              sort: 'distance',
            },
            headers,
          }
        );
        return data.documents;
      } catch {
        // 한 카테고리가 실패해도 나머지 결과는 보여준다
        return [];
      }
    })
  );

  const seenIds = new Set<string>();
  const merged: KakaoPlace[] = [];
  for (const place of results.flat()) {
    if (seenIds.has(place.id)) continue;
    seenIds.add(place.id);
    merged.push(place);
  }

  return merged.sort((a, b) => Number(a.distance ?? 0) - Number(b.distance ?? 0));
};

// 좌표를 도로명/지번 주소 문자열로 변환한다.
export const getAddressName = async (coordinate: Coordinate): Promise<string> => {
  const headers = authHeaders();

  let data: KakaoCoord2AddressResponse;
  try {
    ({ data } = await kakaoClient.get<KakaoCoord2AddressResponse>(KAKAO_COORD2ADDRESS_PATH, {
      params: { x: String(coordinate.longitude), y: String(coordinate.latitude) },
      headers,
    }));
  } catch (error) {
    throw toKakaoError(error, '주소 변환');
  }

  const document = data.documents[0];
  if (!document) return '';

  return document.road_address?.address_name || document.address?.address_name || '';
};
