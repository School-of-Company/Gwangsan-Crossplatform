import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawal } from '../api/withdrawal';
import { removeData } from '~/shared/lib/removeData';
import { clearCurrentUserId } from '~/shared/lib/getCurrentUserId';

export const useWithdrawal = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const withdrawalMutation = useMutation({
    mutationFn: withdrawal,
    onSuccess: () => {
      queryClient.clear();
      router.replace('/onboarding');
    },
    onError: (error) => {
      queryClient.clear();
      router.replace('/onboarding');
      throw error;
    },
  });

  const handleWithdrawal = useCallback(() => {
    removeData('accessToken');
    removeData('refreshToken');
    removeData('memberId');

    clearCurrentUserId();

    withdrawalMutation.mutate();
  }, [withdrawalMutation]);

  return {
    withdrawal: handleWithdrawal,
    isLoading: withdrawalMutation.isPending,
    error: withdrawalMutation.error,
  };
}; 