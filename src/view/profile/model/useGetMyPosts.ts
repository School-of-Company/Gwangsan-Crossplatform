import { useQuery } from '@tanstack/react-query';
import { getMyPost } from '../api/getMyposts';
import { PostType } from '~/shared/types/postType';

export const useGetMyPosts = () => {
  return useQuery<PostType[]>({
    queryKey: ['myPosts'],
    queryFn: getMyPost,
  });
};
