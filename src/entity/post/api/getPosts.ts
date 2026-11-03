import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import { PostType } from '~/shared/types/postType';
import { ImageType } from '~/shared/types/imageType';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';

// 목록 응답은 이미지를 images로 주고, 상태 플래그가 빠질 수 있다
interface PostListItemResponse extends Pick<
  PostType,
  'id' | 'title' | 'content' | 'gwangsan' | 'type' | 'mode' | 'member'
> {
  images?: ImageType[] | null;
  isCompletable?: boolean;
  isCompleted?: boolean;
  isReserved?: boolean;
}

export const getPosts = async (type?: ProductType, mode?: ModeType): Promise<PostType[]> => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (mode) params.append('mode', mode);
    const response = await instance.get<PostListItemResponse[]>('/post?' + params.toString());

    const transformedData: PostType[] = response.data.map((post) => ({
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
