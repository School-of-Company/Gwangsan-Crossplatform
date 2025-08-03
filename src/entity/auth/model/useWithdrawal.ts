import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawal } from '../api/withdrawal';
import { removeData } from '~/shared/lib/removeData';
import { clearCurrentUserId } from '~/shared/lib/getCurrentUserId';
import Toast from 'react-native-toast-message';

export const useWithdrawal = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const withdrawalMutation = useMutation({
    mutationFn: withdrawal,
    onSuccess: () => {
      removeData('accessToken');
      removeData('refreshToken');
      removeData('memberId');
      clearCurrentUserId();
      queryClient.clear();
      router.replace('/onboarding');
    },
    onError: (error) => {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: '회원탈퇴 실패',
      });
    },
  });

  const handleWithdrawal = useCallback(() => {
    withdrawalMutation.mutate();
  }, [withdrawalMutation]);

  return {
    withdrawal: handleWithdrawal,
    isLoading: withdrawalMutation.isPending,
    error: withdrawalMutation.error,
  };
};
