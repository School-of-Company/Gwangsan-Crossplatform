export const PLACE_ITEMS = [
  // 앱에서 운영하는 지점만 노출한다. id는 관리자 웹(Gwangsan-Client-V2 place 상수)과 같은 값이다.
  { id: 1, name: '수완지점' },
  { id: 2, name: '고실마을지점' },
  { id: 4, name: '신창지점' },
] as const;

export const PLACES = PLACE_ITEMS.map((item) => item.name);

export type Place = (typeof PLACES)[number];

export type PlaceItem = (typeof PLACE_ITEMS)[number];

// 서버·DB 지점명이 '수완마을'·'신창동'·'신창지점'처럼 섞여 있어, 관리자 웹과 같이
// 공백과 '지점'·'마을'·'동' 접미사를 반복해서 떼고 비교한다.
const PLACE_NAME_SUFFIXES = ['지점', '마을', '동'];
const normalizePlaceName = (name: string) => {
  let normalized = name.replace(/\s/g, '');
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const suffix of PLACE_NAME_SUFFIXES) {
      if (normalized.length > suffix.length && normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length);
        stripped = true;
      }
    }
  }
  return normalized;
};

export const findPlaceItem = ({
  placeId,
  placeName,
}: {
  placeId?: number | null;
  placeName?: string | null;
}): PlaceItem | undefined => {
  if (placeId != null) {
    const byId = PLACE_ITEMS.find((item) => item.id === placeId);
    if (byId) return byId;
  }
  if (!placeName) return undefined;
  const normalized = normalizePlaceName(placeName);
  return PLACE_ITEMS.find((item) => normalizePlaceName(item.name) === normalized);
};

export const HEAD = {
  12: '광산구도시재생공동체센터',
  13: '광산구자원봉사센터',
  14: '광산구지역사회보장협의체',
  15: '투게더광산나눔문화센터',
} as const;

export type HeadKey = keyof typeof HEAD;
export type HeadValue = (typeof HEAD)[HeadKey];
