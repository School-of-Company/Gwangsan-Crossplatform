import { ModeType } from '~/shared/types/mode';
import { Category } from './category';
import { ProductType } from '~/shared/types/type';

export const handleCategory = (category: ProductType) => {
  switch (category) {
    case 'OBJECT':
      return ['팔아요', '필요해요'];
    case 'SERVICE':
      return ['할 수 있어요', '해주세요'];
  }
};

export const returnValue = (value: Category | undefined): ModeType | undefined => {
  switch (value) {
    case '팔아요':
    case '할 수 있어요':
      return 'GIVER';
    case '필요해요':
    case '해주세요':
      return 'RECEIVER';
    default:
      return undefined;
  }
};
