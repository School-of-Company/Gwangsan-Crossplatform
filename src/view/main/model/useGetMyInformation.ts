import { useQuery } from '@tanstack/react-query';
import { getMyInformation } from '../api/getMyInformation';
import { ProfileType } from '~/shared/types/profileType';

export const useGetMyInformation = () => {
  return useQuery<ProfileType>({
    queryKey: ['myInformation'],
    queryFn: getMyInformation,
  });
};
