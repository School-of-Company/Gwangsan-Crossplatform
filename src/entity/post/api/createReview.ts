import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

interface CreateReviewRequest {
  productId: number;
  content: string;
  light: number;
}

export const createReview = async (data: CreateReviewRequest) => {
  try {
    await instance.post('/review', data);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
