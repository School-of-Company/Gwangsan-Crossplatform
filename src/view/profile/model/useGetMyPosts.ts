import { useQuery } from '@tanstack/react-query';
import { PostType } from '~/shared/types/postType';
import { getMyPost } from '../api/getMyPosts';

export const useGetMyPosts = () => {
  return useQuery<PostType[]>({
    queryKey: ['myPosts'],
    queryFn: getMyPost,
  });
};
