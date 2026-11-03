import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import type { ImageType } from '~/shared/types/imageType';

export interface ReviewDetailResponse {
  reviewId: number;
  productId?: number;
  title: string;
  content: string;
  light: number;
  imageUrls: ImageType[];
}

export const getReview = async (id: string): Promise<ReviewDetailResponse> => {
  try {
    const res = await instance.get<ReviewDetailResponse>('/review/detail/' + id);
    return res.data;
  } catch (error) {
    throw toAppError(error);
  }
};
