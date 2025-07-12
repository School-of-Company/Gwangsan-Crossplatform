import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { createItem } from '../api/createItem';
import { ItemFormRequestBody } from './itemFormSchema';

type CreateItemResult = {
  id: number;
};

type UseCreateItemOptions = {
  onSuccess?: (data: CreateItemResult) => void;
  onError?: (error: Error) => void;
};

export const useCreateItem = (options?: UseCreateItemOptions): UseMutationResult<CreateItemResult, Error, ItemFormRequestBody> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ItemFormRequestBody) => createItem(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['posts', data.type, data.mode],
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};
