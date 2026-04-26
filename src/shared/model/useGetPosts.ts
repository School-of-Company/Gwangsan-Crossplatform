import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Toast from 'react-native-toast-message';
import { getPosts } from '../api/getPosts';
import { PostType } from '../types/postType';
import { ModeType } from '../types/mode';
import { ProductType } from '../types/type';

export const useGetPosts = (mode?: ModeType, type?: ProductType) => {
  return useQuery<PostType[]>({
    queryKey: ['posts', mode, type],
    queryFn: () => getPosts(type, mode),
    throwOnError: (error) => {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      if (status !== undefined && status >= 500) return true;
      Toast.show({
        type: 'error',
        text1: '게시물 불러오기 실패',
        text2: error.message,
      });
      return false;
    },
  });
};
