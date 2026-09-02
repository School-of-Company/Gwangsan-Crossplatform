import { useQuery } from '@tanstack/react-query';
import { getBlockList } from '../api/getBlockList';

export const useGetBlockList = () => {
  return useQuery({
    queryKey: ['blockList'],
    queryFn: getBlockList,
  });
};
