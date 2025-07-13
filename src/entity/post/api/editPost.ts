import { instance } from '~/shared/lib/axios';

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
    throw error;
  }
};
