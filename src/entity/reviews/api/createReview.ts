import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

interface CreateReviewRequest {
  productId: number;
  // 후기 대상자. 서버가 완료된 거래의 상대인지 검증한다
  otherMemberId: number;
  content: string;
  light: number;
}

export const createReview = async (data: CreateReviewRequest) => {
  try {
    await instance.post('/review', data);
    return true;
  } catch (error) {
    throw toAppError(error);
  }
};
