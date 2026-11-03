import { useQuery } from '@tanstack/react-query';
import { getMyInformation } from '../api/getMyInformation';
import { ProfileType } from '~/shared/types/profileType';
import { profileQueryKeys } from '~/shared/model/profileQueryKeys';
import { setData } from '~/shared/lib/setData';
import * as Sentry from '@sentry/react-native';

export const useGetMyInformation = () => {
  return useQuery<ProfileType>({
    queryKey: profileQueryKeys.myInformation(),
    queryFn: async () => {
      const data = await getMyInformation();
      if (data && data.memberId) {
        await setData('memberId', data.memberId.toString());
        Sentry.setUser({ id: data.memberId.toString() });
      }
      return data;
    },
  });
};
