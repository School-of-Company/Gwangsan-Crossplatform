import { useQuery } from '@tanstack/react-query';
import { PostType } from '~/shared/types/postType';
import { getPost } from '../api/getPosts';

export const useGetPosts = (id: string) => {
  return useQuery<PostType[]>({
    queryKey: ['myPosts', id],
    queryFn: () => getPost(id),
  });
};
