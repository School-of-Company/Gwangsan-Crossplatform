import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export const getReview = async (id: string) => {
  try {
    const res = await instance.get('/review/detail/' + id);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
