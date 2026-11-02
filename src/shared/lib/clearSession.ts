import type { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { clearAuthTokens } from './auth';
import { removeData } from './removeData';
import { clearCurrentUserId } from './getCurrentUserId';
import { cleanupNotificationSession } from './sessionCleanup';
import { useChatQueueStore } from '../store/useChatQueueStore';
import { useReadRoomsStore } from '../store/useReadRoomsStore';

// 로그아웃·회원탈퇴·세션 만료(강제 로그아웃)가 모두 같은 범위를 정리하도록 한 곳에 모은다.
// 경로마다 따로 정리하면 이전 계정의 memberId·채팅 대기열 등이 다음 계정에 남는다.
export const clearSession = async (queryClient?: QueryClient | null): Promise<void> => {
  await Promise.allSettled([
    // 토큰과 함께 생체 로그인용 키체인 항목도 지운다
    clearAuthTokens(),
    removeData('memberId'),
    cleanupNotificationSession(),
  ]);

  clearCurrentUserId();
  Sentry.setUser(null);
  useChatQueueStore.getState().reset();
  useReadRoomsStore.getState().reset();
  queryClient?.clear();
};
