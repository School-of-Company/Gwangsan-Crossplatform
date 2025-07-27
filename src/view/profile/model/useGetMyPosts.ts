import { useQuery } from '@tanstack/react-query';
import { PostType } from '~/shared/types/postType';
import { getMyPosts } from '../api/getMyPosts';

export const useGetMyPosts = (isMe: boolean) => {
  return useQuery<PostType[]>({
    queryKey: ['myPosts', 'current'],
    queryFn: getMyPosts,
    enabled: isMe,
    staleTime: 1000 * 60 * 5,
  });
};
