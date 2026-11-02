import { z } from 'zod';
import { ModeType } from '~/shared/types/mode';
import { ProductType } from '~/shared/types/type';

// 서버 CreateProductRequest·PatchProductRequest는 title을 @Size(max = 20), gwangsan을 Integer로 받는다.
// 광산은 0·음수도 허용하므로 Java Integer 범위만 검사한다.
export const ITEM_TITLE_MAX_LENGTH = 20;
export const GWANGSAN_MIN = -2_147_483_648;
export const GWANGSAN_MAX = 2_147_483_647;

const formatAmount = (value: number) => value.toLocaleString('ko-KR');

// 비어 있으면 null — 입력 여부는 필수값 검사에서 따로 다룬다
export const getGwangsanError = (value: string): string | null => {
  if (value.trim().length === 0) return null;
  const amount = Number(value);
  if (!Number.isInteger(amount)) return '광산을 숫자로 입력해 주세요.';
  if (amount < GWANGSAN_MIN || amount > GWANGSAN_MAX) {
    return `광산은 ${formatAmount(GWANGSAN_MIN)} ~ ${formatAmount(GWANGSAN_MAX)} 사이로 입력해 주세요.`;
  }
  return null;
};

export const itemFormSchema = z.object({
  type: z.string(),
  mode: z.string(),
  title: z.string().min(1, '제목을 입력해주세요').max(ITEM_TITLE_MAX_LENGTH),
  content: z.string().min(1, '내용을 입력해주세요'),
  gwangsan: z.number().int().min(GWANGSAN_MIN).max(GWANGSAN_MAX),
  imageIds: z.array(z.number()).optional(),
});

export type ItemFormData = z.infer<typeof itemFormSchema>;

export type ItemFormRequestBody = {
  type: ProductType;
  mode: ModeType;
  title: string;
  content: string;
  gwangsan: number;
  imageIds?: number[];
};

export const createItemFormRequestBody = (data: {
  type: string;
  mode: string;
  title: string;
  content: string;
  gwangsan: string;
  images: string[];
  imageIds?: number[];
}): ItemFormRequestBody => {
  return {
    type: data.type as ProductType,
    mode: data.mode as ModeType,
    title: data.title,
    content: data.content,
    gwangsan: parseInt(data.gwangsan, 10),
    imageIds: data.imageIds && data.imageIds.length > 0 ? data.imageIds : undefined,
  };
};
