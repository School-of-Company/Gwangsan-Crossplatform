const KAKAO_LOCAL_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

export interface KakaoPlace {
  readonly id: string;
  readonly place_name: string;
  readonly address_name: string;
  readonly road_address_name: string;
  readonly x: string; // 경도(longitude)
  readonly y: string; // 위도(latitude)
}

interface KakaoLocalSearchResponse {
  readonly documents: KakaoPlace[];
}

export const searchPlaces = async (query: string): Promise<KakaoPlace[]> => {
  const apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error('카카오 API 키가 설정되지 않았습니다.');
  }

  const response = await fetch(`${KAKAO_LOCAL_SEARCH_URL}?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`장소 검색 요청이 실패했습니다. (${response.status})`);
  }

  const data: KakaoLocalSearchResponse = await response.json();
  return data.documents;
};
