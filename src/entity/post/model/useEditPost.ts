import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { editPost } from '../api/editPost';

interface EditPostData {
  type: string;
  mode: string;
  title: string;
  content: string;
  gwangsan: number;
  imageIds: number[];
}

export const useEditPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditPostData }) => editPost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      Toast.show({
        type: 'success',
        text1: '수정 완료',
        text2: '거래글이 성공적으로 수정되었습니다.',
      });
    },
    onError: (err) => {
      Toast.show({
        type: 'error',
        text1: '수정 실패',
        text2: err instanceof Error ? err.message : '거래글 수정 중 오류가 발생했습니다.',
      });
    },
  });
};
