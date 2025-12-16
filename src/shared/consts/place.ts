export const PLACE_ITEMS = [
  { id: 1, name: '수완마을' },
  { id: 2, name: '고실마을' },
  { id: 3, name: '신가' },
  { id: 4, name: '신창' },
  { id: 5, name: '도산' },
  { id: 6, name: '우산' },
  { id: 7, name: '월곡1' },
  { id: 8, name: '첨단2' },
  { id: 9, name: '월곡2' },
  { id: 10, name: '하남' },
  { id: 11, name: '평동' },
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
