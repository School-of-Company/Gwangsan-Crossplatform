import * as Notifications from 'expo-notifications';
import { chatSocket } from './socket';
import { unregisterChatBackgroundTask, clearChatUnreadState } from './chatBackgroundTask';
import { logger } from './logger';

/**
 * 로그아웃/회원탈퇴 시 알림·소켓 관련 세션 상태를 정리합니다.
 * - 실시간 소켓 연결 종료 (다음 로그인 계정으로 이전 세션이 이어지지 않도록)
 * - 채팅 백그라운드 폴링 태스크 해제
 * - 앱 뱃지 및 미확인 메시지 상태 초기화
 */
export const cleanupNotificationSession = async (): Promise<void> => {
  try {
    chatSocket.disconnect();
  } catch (error) {
    logger.error('Failed to disconnect chat socket on logout', error);
  }

  await Promise.allSettled([
    unregisterChatBackgroundTask(),
    clearChatUnreadState(),
    Notifications.setBadgeCountAsync(0),
  ]);
};
