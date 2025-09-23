import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

interface EditPostRequest {
  type: string;
  mode: string;
  title: string;
  content: string;
  gwangsan: number;
  imageIds: number[];
}

export const editPost = async (id: string, data: EditPostRequest) => {
  try {
    const response = await instance.patch(`/post/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
