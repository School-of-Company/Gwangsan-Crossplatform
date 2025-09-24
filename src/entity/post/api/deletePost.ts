import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export const deletePost = async (postId: number): Promise<void> => {
  try {
    await instance.delete(`/post/${postId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
