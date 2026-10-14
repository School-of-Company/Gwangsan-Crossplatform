import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../api/getMyProfile';
import { ProfileType } from '~/shared/types/profileType';

export const useGetMyProfile = (isMe: boolean) => {
  return useQuery<ProfileType>({
    queryKey: ['myProfile', 'current'],
    queryFn: getMyProfile,
    enabled: isMe,
    staleTime: 1000 * 60 * 5,
    // 앱이 백그라운드에서 돌아오면 실패했거나 오래된 프로필을 다시 받아온다(#724)
    refetchOnWindowFocus: true,
  });
};
