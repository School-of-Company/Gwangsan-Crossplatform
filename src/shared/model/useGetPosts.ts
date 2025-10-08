import { useQuery } from '@tanstack/react-query';
import { getPosts } from '../api/getPosts';
import { PostType } from '../types/postType';
import { ModeType } from '../types/mode';
import { ProductType } from '../types/type';

export const useGetPosts = (mode?: ModeType, type?: ProductType) => {
  return useQuery<PostType[]>({
    queryKey: ['posts', mode, type],
    queryFn: () => getPosts(type, mode),
  });
};
