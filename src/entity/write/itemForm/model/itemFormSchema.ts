import { z } from 'zod';
import { ModeType } from '~/shared/types/mode';
import { ProductType } from '~/shared/types/type';

// 서버 CreateProductRequest·PatchProductRequest는 title을 @Size(max = 20), gwangsan을 Integer로 받는다.
// 서버에는 금액 하한 검증이 없어 0도 저장되므로, 거래가 성립하도록 앱에서 1 이상만 허용한다.
export const ITEM_TITLE_MAX_LENGTH = 20;
export const GWANGSAN_MIN = 1;
export const GWANGSAN_MAX = 2_147_483_647;

// 비어 있으면 null — 입력 여부는 필수값 검사에서 따로 다룬다
export const getGwangsanError = (value: string): string | null => {
  if (value.trim().length === 0) return null;
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < GWANGSAN_MIN) {
    return `광산은 ${GWANGSAN_MIN} 이상으로 입력해 주세요.`;
  }
  if (amount > GWANGSAN_MAX) {
    return `광산은 ${GWANGSAN_MAX.toLocaleString('ko-KR')} 이하로 입력해 주세요.`;
  }
  return null;
};

export const itemFormSchema = z.object({
  type: z.string(),
  mode: z.string(),
  title: z.string().min(1, '제목을 입력해주세요').max(ITEM_TITLE_MAX_LENGTH),
  content: z.string().min(1, '내용을 입력해주세요'),
  gwangsan: z.number().int().min(GWANGSAN_MIN, '광산을 입력해주세요').max(GWANGSAN_MAX),
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
