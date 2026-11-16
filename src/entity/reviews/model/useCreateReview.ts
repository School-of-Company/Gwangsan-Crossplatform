import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '../api/createReview';
import { reviewKeys } from './reviewQueryKeys';

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};
