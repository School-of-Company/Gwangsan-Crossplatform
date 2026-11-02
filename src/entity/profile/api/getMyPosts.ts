import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import type { PostType } from '~/shared/types/postType';

export const getMyPosts = async (): Promise<PostType[]> => {
  try {
    const { data } = await instance.get<PostType[]>('/post/current');
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
