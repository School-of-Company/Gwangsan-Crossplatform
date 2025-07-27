import { instance } from '~/shared/lib/axios';

export const getMyPosts = async () => {
  try {
    return (await instance.get('/post/current')).data;
  } catch (error) {
    throw error;
  }
}; 