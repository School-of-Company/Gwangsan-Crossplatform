import { instance } from '~/shared/lib/axios';
import { assertValidId } from '~/shared/lib/validateId';

export const getPost = async (id: string) => {
  try {
    assertValidId(id);
    return (await instance.get(`/post/member/${id}`)).data;
  } catch (error) {
    throw error;
  }
};
