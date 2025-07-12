import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '../api/createItem';
import { ItemFormRequestBody } from './itemFormSchema';
import Toast from 'react-native-toast-message';

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ItemFormRequestBody) => createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      Toast.show({
        type: 'success',
        text1: '등록 완료',
        text2: '거래글이 성공적으로 등록되었습니다.',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: '등록 실패',
        text2: error.message || '거래글 등록 중 오류가 발생했습니다.',
      });
    },
  });
};
