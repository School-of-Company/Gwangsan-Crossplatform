import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../api/getMyProfile';

export const useGetMyProfile = () => {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
  });
};
