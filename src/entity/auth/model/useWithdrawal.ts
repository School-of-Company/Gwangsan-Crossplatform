import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawal } from '../api/withdrawal';
import { clearSession } from '~/shared/lib/clearSession';
import Toast from 'react-native-toast-message';
import { logger } from '~/shared/lib/logger';

export const useWithdrawal = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const withdrawalMutation = useMutation({
    mutationFn: withdrawal,
    onSuccess: async () => {
      await clearSession(queryClient);
      router.replace('/onboarding');
    },
    onError: (error) => {
      logger.error('withdrawal failed', error);
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
