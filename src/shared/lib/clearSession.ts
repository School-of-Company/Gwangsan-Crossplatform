import type { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { clearAuthTokens } from './auth';
import { removeData } from './removeData';
import { clearCurrentUserId } from './getCurrentUserId';
import { cleanupNotificationSession } from './sessionCleanup';
import { chatSocket } from './socket';
import { logger } from './logger';
import { useChatQueueStore } from '~/shared/store/useChatQueueStore';
import { useReadRoomsStore } from '~/shared/store/useReadRoomsStore';

// 로그아웃·회원탈퇴·세션 만료(강제 로그아웃)가 모두 같은 범위를 정리하도록 한 곳에 모은다.
// 경로마다 따로 정리하면 이전 계정의 memberId·채팅 대기열 등이 다음 계정에 남는다.
export const clearSession = async (queryClient?: QueryClient | null): Promise<void> => {
  // 토큰을 지우기 전에 소켓부터 끊어, 진행 중이던 연결 시도가 지워지는 토큰으로 접속하지 않게 한다
  try {
    chatSocket.disconnect();
  } catch (error) {
    logger.error('Failed to disconnect chat socket on logout', error);
  }

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
