import type { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { clearAuthTokens } from './auth';
import { removeData } from './removeData';
import { clearCurrentUserId } from './getCurrentUserId';
import { cleanupNotificationSession } from './sessionCleanup';
import { useChatQueueStore } from '../store/useChatQueueStore';
import { useReadRoomsStore } from '../store/useReadRoomsStore';

// 로그아웃·회원탈퇴·세션 만료(강제 로그아웃)가 모두 같은 범위를 정리하도록 한 곳에 모은다(#737).
// 예전에는 경로마다 정리하는 항목이 달라, 강제 로그아웃 뒤에는 memberId·Sentry 사용자·알림 세션이
// 남고, 어느 경로에서도 채팅 전송 대기열·읽음 상태는 비우지 않아 다른 계정으로 로그인해도 남았다.
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
