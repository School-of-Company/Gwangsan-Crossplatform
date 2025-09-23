import { instance } from '~/shared/lib/axios';
import { PostType } from '~/shared/types/postType';
import { ImageType } from '~/shared/types/imageType';
import { getErrorMessage } from '~/shared/lib/errorHandler';
export interface PostDetailResponse extends Omit<PostType, 'imageUrls'> {
  member: {
    memberId: number;
    nickname: string;
    placeName: string;
    light: number;
  };
  images: ImageType[];
}

export const getItem = async (postId: string): Promise<PostDetailResponse> => {
  try {
    const { data } = await instance.get<PostDetailResponse>(`/post/${postId}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
