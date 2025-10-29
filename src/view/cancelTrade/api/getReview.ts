import { instance } from '~/shared/lib/axios';

export const getReview = async (id: string) => {
  try {
    const res = await instance.get('/review/' + id);
    return res.data;
  } catch (error) {
    throw error;
  }
};
