import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { getPosts } from '../api/getPosts';
import { PostType } from '~/shared/types/postType';
import { ModeType } from '~/shared/types/mode';
import { ProductType } from '~/shared/types/type';
import { postKeys } from '~/shared/model/postQueryKeys';

export const useGetPosts = (mode?: ModeType, type?: ProductType) => {
  return useQuery<PostType[]>({
    queryKey: postKeys.list(mode, type),
    queryFn: () => getPosts(type, mode),
    // 5xx만 ErrorBoundary로 던지고, 나머지 실패는 화면(PostList)의 ErrorFallback이 보여준다
    throwOnError: (error) => {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      return status !== undefined && status >= 500;
    },
  });
};
