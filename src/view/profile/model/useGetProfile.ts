import { useQuery } from '@tanstack/react-query';
import { ProfileType } from '~/shared/types/profileType';
import { getProfile } from '../api/getProfile';

export const useGetProfile = (id: string | null) => {
  return useQuery<ProfileType>({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id!),
    enabled: !!id,
    // 앱이 백그라운드에서 돌아오면 실패했거나 오래된 프로필을 다시 받아온다(#724)
    refetchOnWindowFocus: true,
  });
};
