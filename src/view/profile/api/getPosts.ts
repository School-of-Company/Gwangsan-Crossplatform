import { instance } from '~/shared/lib/axios';
import { assertValidId } from '~/shared/lib/validateId';
import { toAppError } from '~/shared/lib/errorHandler';
import type { PostType } from '~/shared/types/postType';

export const getPost = async (id: string): Promise<PostType[]> => {
  try {
    assertValidId(id);
    const { data } = await instance.get<PostType[]>(`/post/member/${id}`);
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
