import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signout } from '../api/signout';
import { clearSession } from '~/shared/lib/clearSession';

export const useSignout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cleanup = async () => {
    // accessToken/refreshToken을 지우지 않으면 앱을 재시작했을 때 index.tsx가
    // 남아 있는 accessToken을 보고 로그인 상태로 되돌려보내, 로그아웃이 실제로는
    // 유지되지 않는다. 이후 만료/폐기된 토큰으로 요청이 나가면 401·No refresh token
    // 에러로 이어진다.
    await clearSession(queryClient);
    router.replace('/onboarding');
  };

  const signoutMutation = useMutation({
    mutationFn: signout,
    onSuccess: cleanup,
    // 서버 로그아웃이 실패해도 기기에서는 로그아웃 상태로 만든다. onError에서 다시 던져도
    // mutate()에서는 아무 효과가 없어 제거했다
    onError: cleanup,
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
