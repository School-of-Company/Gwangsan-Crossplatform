import { z } from 'zod';
import { MODE, TYPE } from '@/shared/types/postType';

export const itemFormSchema = z.object({
  type: z.string(),
  mode: z.string(),
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  gwangsan: z.number().min(1, '광산을 입력해주세요'),
  imageIds: z.array(z.number()).optional(),
});

export type ItemFormData = z.infer<typeof itemFormSchema>;

export type ItemFormRequestBody = {
  type: TYPE;
  mode: MODE;
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
    type: data.type as TYPE,
    mode: data.mode as MODE,
    title: data.title,
    content: data.content,
    gwangsan: parseInt(data.gwangsan, 10),
    imageIds: data.imageIds && data.imageIds.length > 0 ? data.imageIds : undefined,
  };
};
