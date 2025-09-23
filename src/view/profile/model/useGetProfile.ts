import { useQuery } from '@tanstack/react-query';
import { ProfileType } from '~/shared/types/profileType';
import { getProfile } from '../api/getProfile';

export const useGetProfile = (id: string | null) => {
  return useQuery<ProfileType>({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id!),
    enabled: !!id,
  });
};
