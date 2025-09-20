import { ProductType } from './type';

export const MODE = {
  GIVER: 'GIVER',
  RECEIVER: 'RECEIVER',
} as const;

export type ModeType = (typeof MODE)[keyof typeof MODE];

export const ModeMessage: Record<ProductType, Record<ModeType, string>> = {
  물건: {
    [MODE.GIVER]: '팔아요',
    [MODE.RECEIVER]: '필요해요',
  },
  서비스: {
    [MODE.GIVER]: '할 수 있어요',
    [MODE.RECEIVER]: '해주세요',
  },
};
