export const PLACE_ITEMS = [
  // ponytail: 신창/고실 지점만 노출 (#777). 다른 지점 추가 필요 시 여기 항목을 늘릴 것.
  { id: 2, name: '고실마을' },
  { id: 4, name: '신창' },
  { id: 12, name: '광산구도시재생공동체센터' },
  { id: 13, name: '광산구자원봉사센터' },
  { id: 14, name: '광산구지역사회보장협의체' },
  { id: 15, name: '투게더광산나눔문화센터' },
] as const;

export const PLACES = PLACE_ITEMS.map((item) => item.name);

export type Place = (typeof PLACES)[number];

export const HEAD = {
  12: '광산구도시재생공동체센터',
  13: '광산구자원봉사센터',
  14: '광산구지역사회보장협의체',
  15: '투게더광산나눔문화센터',
} as const;

export type HeadKey = keyof typeof HEAD;
export type HeadValue = (typeof HEAD)[HeadKey];
