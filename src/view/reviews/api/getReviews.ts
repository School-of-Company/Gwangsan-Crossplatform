import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { ReviewPostType } from '../model/reviewPostType';

export const getReceiveReview = async (id: string): Promise<ReviewPostType[]> => {
  try {
    const { data } = await instance.get<ReviewPostType[]>(`/review/${id}`);
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
