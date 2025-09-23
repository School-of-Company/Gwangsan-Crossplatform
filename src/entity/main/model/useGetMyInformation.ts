import { useQuery } from '@tanstack/react-query';
import { getMyInformation } from '../../../view/main/api/getMyInformation';
import { ProfileType } from '~/shared/types/profileType';
import { setData } from '~/shared/lib/setData';

export const useGetMyInformation = () => {
  return useQuery<ProfileType>({
    queryKey: ['myInformation'],
    queryFn: async () => {
      const data = await getMyInformation();
      if (data && data.memberId) {
        await setData('memberId', data.memberId.toString());
      }
      return data;
    },
  });
};
