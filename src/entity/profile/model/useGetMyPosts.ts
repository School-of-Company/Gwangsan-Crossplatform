import { useQuery } from '@tanstack/react-query';
import { PostType } from '~/shared/types/postType';
import { profileQueryKeys } from '~/shared/model/profileQueryKeys';
import { getMyPosts } from '../api/getMyPosts';

export const useGetMyPosts = (isMe: boolean) => {
  return useQuery<PostType[]>({
    queryKey: profileQueryKeys.myPosts(),
    queryFn: getMyPosts,
    enabled: isMe,
    staleTime: 1000 * 60 * 5,
  });
};
