import { useQuery } from '@tanstack/react-query';
import { getAlertList } from '../api/getAlertList';
import { AlertListResponse } from './alertTypes';

export const useGetAlertList = () => {
  return useQuery<AlertListResponse>({
    queryKey: ['alertList'],
    queryFn: getAlertList,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
