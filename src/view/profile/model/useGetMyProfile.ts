import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../api/getMyProfile';
import { ProfileType } from './profileType';

export const useGetMyProfile = () => {
  return useQuery<ProfileType>({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
  });
};
