import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import { PostType } from '~/shared/types/postType';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';

export const getPosts = async (type?: ProductType, mode?: ModeType): Promise<PostType[]> => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (mode) params.append('mode', mode);
    const response = await instance.get('/post?' + params.toString());

    const transformedData: PostType[] = response.data.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      gwangsan: post.gwangsan,
      type: post.type,
      mode: post.mode,
      imageUrls: post.images || [],
      isCompletable: post.isCompletable ?? false,
      isCompleted: post.isCompleted ?? false,
      isReserved: post.isReserved ?? false,
      member: post.member,
    }));

    return transformedData;
  } catch (error) {
    throw toAppError(error);
  }
};
