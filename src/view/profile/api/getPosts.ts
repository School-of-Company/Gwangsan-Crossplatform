import { instance } from '~/shared/lib/axios';

export const getPost = async (id: string) => {
  try {
    return (await instance.get(`/post/member/${id}`)).data;
  } catch (error) {
    throw error;
  }
};
