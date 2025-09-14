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
