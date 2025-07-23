import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { signout } from '../api/signout';
import { removeData } from '~/shared/lib/removeData';

export const useSignout = () => {
  const router = useRouter();

  const signoutMutation = useMutation({
    mutationFn: signout,
    onSuccess: () => {
      router.replace('/onboarding');
    },
    onError: (error) => {
      console.error('로그아웃 에러:', error);
      router.replace('/onboarding');
    },
  });

  const handleSignout = useCallback(() => {
    removeData('accessToken');
    removeData('refreshToken');
    signoutMutation.mutate();
  }, [signoutMutation]);

  return {
    signout: handleSignout,
    isLoading: signoutMutation.isPending,
    error: signoutMutation.error,
  };
};
