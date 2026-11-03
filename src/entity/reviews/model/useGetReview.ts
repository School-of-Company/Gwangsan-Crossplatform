import { useQuery } from '@tanstack/react-query';
import { getReview, ReviewDetailResponse } from '../api/getReview';
import { reviewKeys } from './reviewQueryKeys';

export const useGetReview = (id: string) => {
  return useQuery<ReviewDetailResponse>({
    queryKey: reviewKeys.detail(id),
    queryFn: () => getReview(id),
    enabled: !!id,
  });
};
