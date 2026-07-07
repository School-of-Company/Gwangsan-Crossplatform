import { MODE, ModeType } from './mode';
import { ProductType, TYPE } from './type';

export const TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: TYPE.OBJECT, label: '물건' },
  { value: TYPE.SERVICE, label: '서비스' },
];

export const MODE_OPTIONS: Record<ProductType, { value: ModeType; label: string }[]> = {
  [TYPE.OBJECT]: [
    { value: MODE.GIVER, label: '팔아요' },
    { value: MODE.RECEIVER, label: '필요해요' },
  ],
  [TYPE.SERVICE]: [
    { value: MODE.GIVER, label: '할 수 있어요' },
    { value: MODE.RECEIVER, label: '해주세요' },
  ],
};

export const getTypeLabel = (type: string): string =>
  TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;

export const getModeLabel = (type: string, mode: string): string =>
  MODE_OPTIONS[type as ProductType]?.find((option) => option.value === mode)?.label ?? mode;
