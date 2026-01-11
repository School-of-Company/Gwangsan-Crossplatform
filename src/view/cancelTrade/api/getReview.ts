import { instance } from '~/shared/lib/axios';

export const getReview = async (id: string) => {
  try {
    const res = await instance.get('/review/detail/' + id);
    return res.data;
  } catch (error) {
    throw error;
  }
};
