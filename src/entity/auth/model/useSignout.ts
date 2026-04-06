import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signout } from '../api/signout';
import { removeData } from '~/shared/lib/removeData';
import { clearCurrentUserId } from '~/shared/lib/getCurrentUserId';
import * as Sentry from '@sentry/react-native';

export const useSignout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cleanup = () => {
    removeData('memberId');
    clearCurrentUserId();
    Sentry.setUser(null);
    queryClient.clear();
    router.replace('/onboarding');
  };

  const signoutMutation = useMutation({
    mutationFn: signout,
    onSuccess: cleanup,
    onError: (error) => {
      cleanup();
      throw error;
    },
  });

  const handleSignout = useCallback(() => {
    signoutMutation.mutate();
  }, [signoutMutation]);

  return {
    signout: handleSignout,
    isLoading: signoutMutation.isPending,
    error: signoutMutation.error,
  };
};
