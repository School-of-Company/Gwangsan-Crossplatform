import * as Notifications from 'expo-notifications';
import { chatSocket } from './socket';
import { logger } from './logger';

/**
 * 로그아웃/회원탈퇴 시 알림·소켓 관련 세션 상태를 정리합니다.
 * - 실시간 소켓 연결 종료 (다음 로그인 계정으로 이전 세션이 이어지지 않도록)
 * - 앱 뱃지 초기화
 */
export const cleanupNotificationSession = async (): Promise<void> => {
  try {
    chatSocket.disconnect();
  } catch (error) {
    logger.error('Failed to disconnect chat socket on logout', error);
  }

  await Notifications.setBadgeCountAsync(0).catch(() => {});
};
