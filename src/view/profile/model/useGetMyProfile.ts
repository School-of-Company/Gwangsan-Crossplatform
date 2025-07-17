import { useQuery } from '@tanstack/react-query';
import { PostType } from '~/shared/types/postType';
import { getMyProfile } from '../api/getMyProfile';

export const useGetMyProfile = (isMe: boolean) => {
  return useQuery<PostType[]>({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    enabled: isMe,
  });
};
