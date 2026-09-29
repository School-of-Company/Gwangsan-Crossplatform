import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { ReviewPostType } from '../model/reviewPostType';

export interface ReviewsPageParams {
  // 1~100. cursor를 함께 보낼 때는 반드시 size도 함께 보내야 한다(size 없는 cursor는 400).
  size: number;
  // 직전 페이지 마지막 reviewId. 첫 요청에는 생략해야 하며, 0이나 빈 문자열로 보내면 안 된다.
  cursor?: number;
}

export const getReceiveReview = async (
  id: string,
  params?: ReviewsPageParams
): Promise<ReviewPostType[]> => {
  try {
    const { data } = params
      ? await instance.get<ReviewPostType[]>(`/review/${id}`, { params })
      : await instance.get<ReviewPostType[]>(`/review/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// 내가 받은 후기. 명세상 /review/{member_id}와 별개 엔드포인트
export const getMyReceivedReview = async (
  params?: ReviewsPageParams
): Promise<ReviewPostType[]> => {
  try {
    const { data } = params
      ? await instance.get<ReviewPostType[]>('/review/current', { params })
      : await instance.get<ReviewPostType[]>('/review/current');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getTossReview = async (): Promise<ReviewPostType[]> => {
  try {
    const { data } = await instance.get<ReviewPostType[]>('/review');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
