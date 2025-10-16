export const PLACES = [
  '고실마을',
  '수완마을',
  '신가',
  '신창',
  '도산',
  '우산',
  '월곡1',
  '첨단2',
  '평동',
  '월곡2',
  '하남',
  '도시재생공동체센터',
] as const;

export type Place = (typeof PLACES)[number];

export const HEAD = {
  1: '광산구도시재생공동체센터',
  2: '광산구자원봉사센터',
  3: '광산구지역사회보장협의체',
  4: '투게더광산나눔문화센터',
} as const;

export type HeadKey = keyof typeof HEAD;
export type HeadValue = (typeof HEAD)[HeadKey];
