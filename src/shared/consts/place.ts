export const PLACE_ITEMS = [
  // ponytail: 신창/고실 지점만 노출 (#777). 다른 지점 추가 필요 시 여기 항목을 늘릴 것.
  { id: 2, name: '고실마을지점' },
  { id: 4, name: '신창지점' },
] as const;

export const PLACES = PLACE_ITEMS.map((item) => item.name);

export type Place = (typeof PLACES)[number];

export type PlaceItem = (typeof PLACE_ITEMS)[number];

// 서버·DB 지점명이 '신창'과 '신창지점'으로 섞여 있을 수 있어 어느 쪽이 와도 같은 지점으로 본다.
// 웹 목록에는 '신창동'으로 나오기도 해 '동' 접미사도 무시한다.
const normalizePlaceName = (name: string) => name.replace(/\s/g, '').replace(/(지점|동)$/, '');

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
