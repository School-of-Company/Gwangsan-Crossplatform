import { useQuery } from '@tanstack/react-query';
import { getBlockList } from '../api/getBlockList';
import { blockKeys } from './blockQueryKeys';

export const useGetBlockList = () => {
  return useQuery({
    queryKey: blockKeys.list(),
    queryFn: getBlockList,
  });
};
