import { useQuery } from '@tanstack/react-query';
import { getAlertList } from '../api/getAlertList';
import { AlertListResponse } from './alertTypes';
import { alertKeys } from './alertQueryKeys';

export const useGetAlertList = () => {
  return useQuery<AlertListResponse>({
    queryKey: alertKeys.list(),
    queryFn: getAlertList,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
