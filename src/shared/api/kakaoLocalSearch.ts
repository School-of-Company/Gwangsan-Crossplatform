const KAKAO_LOCAL_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';
const KAKAO_LOCAL_CATEGORY_URL = 'https://dapi.kakao.com/v2/local/search/category.json';
const KAKAO_COORD2ADDRESS_URL = 'https://dapi.kakao.com/v2/local/geo/coord2address.json';

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

export const searchPlaces = async (query: string): Promise<KakaoPlace[]> => {
  const apiKey = getKakaoApiKey();

  const response = await fetch(
    `${KAKAO_LOCAL_SEARCH_URL}?${new URLSearchParams({ query }).toString()}`,
    { headers: { Authorization: `KakaoAK ${apiKey}` } }
  );

  if (!response.ok) {
    throw new Error(`장소 검색 요청이 실패했습니다. (${response.status})`);
  }

  const data: KakaoLocalSearchResponse = await response.json();
  return data.documents;
};

// 좌표 주변의 지하철역/편의점/카페/은행을 거리순으로 검색해 병합한다.
export const searchNearbyPlaces = async (
  coordinate: Coordinate,
  radius: number
): Promise<KakaoPlace[]> => {
  const apiKey = getKakaoApiKey();
  const headers = { Authorization: `KakaoAK ${apiKey}` };

  const results = await Promise.all(
    NEARBY_CATEGORY_GROUP_CODES.map(async (categoryGroupCode) => {
      const params = new URLSearchParams({
        category_group_code: categoryGroupCode,
        x: String(coordinate.longitude),
        y: String(coordinate.latitude),
        radius: String(radius),
        sort: 'distance',
      });

      const response = await fetch(`${KAKAO_LOCAL_CATEGORY_URL}?${params.toString()}`, {
        headers,
      });
      if (!response.ok) return [];

      const data: KakaoLocalSearchResponse = await response.json();
      return data.documents;
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
  const apiKey = getKakaoApiKey();

  const params = new URLSearchParams({
    x: String(coordinate.longitude),
    y: String(coordinate.latitude),
  });

  const response = await fetch(`${KAKAO_COORD2ADDRESS_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`주소 변환 요청이 실패했습니다. (${response.status})`);
  }

  const data: KakaoCoord2AddressResponse = await response.json();
  const document = data.documents[0];
  if (!document) return '';

  return document.road_address?.address_name || document.address?.address_name || '';
};
