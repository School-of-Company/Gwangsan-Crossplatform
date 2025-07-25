import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../api/getMyProfile';
import { ProfileType } from '~/shared/types/profileType';

export const useGetMyProfile = (isMe: boolean) => {
  return useQuery<ProfileType>({
    queryKey: ['myProfile', 'current'],
    queryFn: getMyProfile,
    enabled: isMe,
    staleTime: 1000 * 60 * 5,
  });
};
