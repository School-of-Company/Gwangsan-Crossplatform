import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signout } from '../api/signout';
import { clearCredentialsForBiometric } from '../api/signin';
import { removeData } from '~/shared/lib/removeData';
import { clearAuthTokens } from '~/shared/lib/auth';
import { clearCurrentUserId } from '~/shared/lib/getCurrentUserId';
import { cleanupNotificationSession } from '~/shared/lib/sessionCleanup';
import * as Sentry from '@sentry/react-native';

export const useSignout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cleanup = async () => {
    // accessToken/refreshToken을 지우지 않으면 앱을 재시작했을 때 index.tsx가
    // 남아 있는 accessToken을 보고 로그인 상태로 되돌려보내, 로그아웃이 실제로는
    // 유지되지 않는다. 이후 만료/폐기된 토큰으로 요청이 나가면 401·No refresh token
    // 에러로 이어진다.
    await Promise.allSettled([
      clearAuthTokens(),
      clearCredentialsForBiometric(),
      removeData('memberId'),
      cleanupNotificationSession(),
    ]);
    clearCurrentUserId();
    Sentry.setUser(null);
    queryClient.clear();
    router.replace('/onboarding');
  };

  const signoutMutation = useMutation({
    mutationFn: signout,
    onSuccess: cleanup,
    onError: async (error) => {
      await cleanup();
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
