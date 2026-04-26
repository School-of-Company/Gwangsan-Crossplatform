import { instance } from '../lib/axios';
import { toAppError } from '../lib/errorHandler';
import { PostType } from '../types/postType';
import { ProductType } from '../types/type';
import { ModeType } from '../types/mode';

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
    }));

    return transformedData;
  } catch (error) {
    throw toAppError(error);
  }
};
