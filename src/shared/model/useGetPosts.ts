import { useQuery } from '@tanstack/react-query';
import { getPosts } from '../api/getPosts';
import { MODE, PostType, TYPE } from '../types/postType';

export const useGetPosts = (mode: MODE, type: TYPE) => {
  return useQuery<PostType[]>({
    queryKey: ['posts', mode, type],
    queryFn: () => getPosts(type, mode),
    enabled: !!type && !!mode,
  });
};
