import * as Notifications from 'expo-notifications';
import { chatSocket } from '~/shared/lib/socket';
import { logger } from '~/shared/lib/logger';
import { cleanupNotificationSession } from '../sessionCleanup';

jest.mock('~/shared/lib/socket', () => ({
  chatSocket: { disconnect: jest.fn() },
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

jest.mock('expo-notifications', () => ({
  setBadgeCountAsync: jest.fn(),
}));

const mockDisconnect = chatSocket.disconnect as jest.Mock;
const mockSetBadge = Notifications.setBadgeCountAsync as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSetBadge.mockResolvedValue(undefined);
});

describe('cleanupNotificationSession', () => {
  it('정상 흐름: 소켓 연결을 끊고 뱃지를 초기화한다', async () => {
    await cleanupNotificationSession();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockSetBadge).toHaveBeenCalledWith(0);
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('chatSocket.disconnect가 동기적으로 예외를 던져도 로깅 후 뱃지 초기화를 계속 진행한다', async () => {
    const disconnectError = new Error('socket already closed');
    mockDisconnect.mockImplementationOnce(() => {
      throw disconnectError;
    });

    await expect(cleanupNotificationSession()).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to disconnect chat socket on logout',
      disconnectError
    );
    expect(mockSetBadge).toHaveBeenCalledWith(0);
  });

  it('뱃지 초기화가 실패(reject)해도 예외를 던지지 않는다', async () => {
    mockSetBadge.mockRejectedValueOnce(new Error('badge failed'));

    await expect(cleanupNotificationSession()).resolves.toBeUndefined();
  });
});
