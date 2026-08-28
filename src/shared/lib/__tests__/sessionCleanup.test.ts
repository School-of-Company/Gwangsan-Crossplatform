import * as Notifications from 'expo-notifications';
import { chatSocket } from '~/shared/lib/socket';
import {
  unregisterChatBackgroundTask,
  clearChatUnreadState,
} from '~/shared/lib/chatBackgroundTask';
import { logger } from '~/shared/lib/logger';
import { cleanupNotificationSession } from '../sessionCleanup';

jest.mock('~/shared/lib/socket', () => ({
  chatSocket: { disconnect: jest.fn() },
}));

jest.mock('~/shared/lib/chatBackgroundTask', () => ({
  unregisterChatBackgroundTask: jest.fn(),
  clearChatUnreadState: jest.fn(),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

jest.mock('expo-notifications', () => ({
  setBadgeCountAsync: jest.fn(),
}));

const mockDisconnect = chatSocket.disconnect as jest.Mock;
const mockUnregister = unregisterChatBackgroundTask as jest.Mock;
const mockClearUnread = clearChatUnreadState as jest.Mock;
const mockSetBadge = Notifications.setBadgeCountAsync as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUnregister.mockResolvedValue(undefined);
  mockClearUnread.mockResolvedValue(undefined);
  mockSetBadge.mockResolvedValue(undefined);
});

describe('cleanupNotificationSession', () => {
  it('정상 흐름: 소켓 연결을 끊고 백그라운드 태스크 해제, 미확인 상태 초기화, 뱃지 초기화를 모두 수행한다', async () => {
    await cleanupNotificationSession();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockUnregister).toHaveBeenCalledTimes(1);
    expect(mockClearUnread).toHaveBeenCalledTimes(1);
    expect(mockSetBadge).toHaveBeenCalledWith(0);
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('chatSocket.disconnect가 동기적으로 예외를 던져도 로깅 후 나머지 정리 작업을 계속 진행한다', async () => {
    const disconnectError = new Error('socket already closed');
    mockDisconnect.mockImplementationOnce(() => {
      throw disconnectError;
    });

    await expect(cleanupNotificationSession()).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to disconnect chat socket on logout',
      disconnectError
    );
    expect(mockUnregister).toHaveBeenCalledTimes(1);
    expect(mockClearUnread).toHaveBeenCalledTimes(1);
    expect(mockSetBadge).toHaveBeenCalledWith(0);
  });

  it('일부 정리 작업이 실패(reject)해도 예외를 던지지 않는다', async () => {
    mockUnregister.mockRejectedValueOnce(new Error('unregister failed'));

    await expect(cleanupNotificationSession()).resolves.toBeUndefined();

    expect(mockClearUnread).toHaveBeenCalledTimes(1);
    expect(mockSetBadge).toHaveBeenCalledWith(0);
  });
});
