import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '../api/createItem';
import { ItemFormRequestBody } from './itemFormSchema';
import Toast from 'react-native-toast-message';
import { PostType } from '@/shared/types/postType';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';

type MutationContext = {
  previousPosts?: PostType[];
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ItemFormRequestBody) => createItem(data),

    onMutate: async (newItem: ItemFormRequestBody) => {
      await queryClient.cancelQueries({
        queryKey: ['posts', newItem.mode, newItem.type],
      });

      const previousPosts = queryClient.getQueryData<PostType[]>([
        'posts',
        newItem.mode,
        newItem.type,
      ]);

      if (previousPosts) {
        const tempId = -Date.now();

        queryClient.setQueryData<PostType[]>(
          ['posts', newItem.mode, newItem.type],
          [
            {
              id: tempId,
              type: newItem.type as ProductType,
              mode: newItem.mode as ModeType,
              title: newItem.title,
              content: newItem.content,
              gwangsan: newItem.gwangsan,
              imageUrls: [],
              isCompletable: false,
              isCompleted: false,
            },
            ...previousPosts,
          ]
        );
      }

      return { previousPosts } as MutationContext;
    },

    onError: (err, variables, context?: MutationContext) => {
      if (!variables || !context?.previousPosts) return;

      queryClient.setQueryData(['posts', variables.mode, variables.type], context.previousPosts);

      Toast.show({
        type: 'error',
        text1: '등록 실패',
        text2: err instanceof Error ? err.message : '거래글 등록 중 오류가 발생했습니다.',
      });
    },

    onSuccess: (_response, variables) => {
      if (!variables) return;

      queryClient.invalidateQueries({
        queryKey: ['posts', variables.mode, variables.type],
      });

      Toast.show({
        type: 'success',
        text1: '등록 완료',
        text2: '거래글이 성공적으로 등록되었습니다.',
      });
    },

    onSettled: (_response, _error, variables) => {
      if (!variables) return;

      queryClient.invalidateQueries({
        queryKey: ['posts', variables.mode, variables.type],
      });
    },
  });
};
