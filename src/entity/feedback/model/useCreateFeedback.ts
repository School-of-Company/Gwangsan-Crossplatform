import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { createFeedback, type FeedbackType } from '../api/createFeedback';
import { getFeedbackEnvironment } from './getFeedbackEnvironment';
import { feedbackQueryKeys } from './feedbackQueryKeys';

interface CreateFeedbackParams {
  type: FeedbackType;
  content: string;
  imageIds: number[];
}

export const useCreateFeedback = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (params: CreateFeedbackParams) =>
      createFeedback({ ...params, ...getFeedbackEnvironment() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.myList() });
      Toast.show({
        type: 'success',
        text1: '의견 접수 완료',
        text2: '소중한 의견 감사합니다.',
        visibilityTime: 2000,
      });
      onSuccess?.();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '의견 전송 실패',
        text2: error instanceof Error ? error.message : '의견 전송 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    },
  });

  return {
    createFeedback: mutation.mutate,
    isLoading: mutation.isPending,
  };
};
