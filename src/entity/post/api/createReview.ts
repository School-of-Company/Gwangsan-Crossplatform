import { instance } from '~/shared/lib/axios';

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
    throw error;
  }
}; 