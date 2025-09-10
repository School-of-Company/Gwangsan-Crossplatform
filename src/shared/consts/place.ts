export const PLACE = [
  '수완세영',
  '수완마을',
  '신가',
  '신창',
  '도산',
  '우산',
  '월곡1',
  '첨단1',
  '평동',
  '월곡2',
  '하남',
] as const;

export type Place = (typeof PLACE)[number];
