import { instance } from '~/shared/lib/axios';

export const deletePost = async (postId: number): Promise<void> => {
  try {
    await instance.delete(`/post/${postId}`);
  } catch (error) {
    throw error;
  }
};
