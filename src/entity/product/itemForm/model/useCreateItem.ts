import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '../api/createItem';
import { ItemFormRequestBody } from './itemFormSchema';
import Toast from 'react-native-toast-message';
import { MODE, PostType, TYPE } from '@/shared/types/postType';

type MutationContext = {
  previousPosts?: PostType[];
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ItemFormRequestBody) => createItem(data),
    
    onMutate: async (newItem: ItemFormRequestBody) => {
      await queryClient.cancelQueries({ 
        queryKey: ['posts', newItem.mode, newItem.type] 
      });
      
      const previousPosts = queryClient.getQueryData<PostType[]>(
        ['posts', newItem.mode, newItem.type]
      );
      
      if (previousPosts) {
        queryClient.setQueryData<PostType[]>(
          ['posts', newItem.mode, newItem.type],
          [
            {
              id: Date.now(),
              type: newItem.type as TYPE,
              mode: newItem.mode as MODE,
              title: newItem.title,
              content: newItem.content,
              gwangsan: newItem.gwangsan,
              imageUrls: [],
            },
            ...previousPosts,
          ]
        );
      }
      
      return { previousPosts } as MutationContext;
    },
    
    onError: (err, newItem: ItemFormRequestBody, context?: MutationContext) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          ['posts', newItem.mode, newItem.type],
          context.previousPosts
        );
      }
      
      Toast.show({
        type: 'error',
        text1: '등록 실패',
        text2: err instanceof Error ? err.message : '거래글 등록 중 오류가 발생했습니다.',
      });
    },
    
    onSuccess: (variables: ItemFormRequestBody) => {
      queryClient.invalidateQueries({ 
        queryKey: ['posts', variables.mode, variables.type] 
      });
      
      Toast.show({
        type: 'success',
        text1: '등록 완료',
        text2: '거래글이 성공적으로 등록되었습니다.',
      });
    },
    
    onSettled: (variables: ItemFormRequestBody | undefined) => {
      if (!variables) return;
      queryClient.invalidateQueries({ 
        queryKey: ['posts', variables.mode, variables.type] 
      });
    },
  });
};
