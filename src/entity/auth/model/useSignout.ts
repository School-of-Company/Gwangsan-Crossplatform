import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signout } from '../api/signout';
import { removeData } from '~/shared/lib/removeData';
import { clearCurrentUserId } from '~/shared/lib/getCurrentUserId';

export const useSignout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const signoutMutation = useMutation({
    mutationFn: signout,
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

  const handleSignout = useCallback(() => {
    removeData('accessToken');
    removeData('refreshToken');
    removeData('memberId');
    
    clearCurrentUserId();
    
    signoutMutation.mutate();
  }, [signoutMutation]);

  return {
    signout: handleSignout,
    isLoading: signoutMutation.isPending,
    error: signoutMutation.error,
  };
};
