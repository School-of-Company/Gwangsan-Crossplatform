import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { clearSession } from '../clearSession';
import { clearAuthTokens } from '../auth';
import { removeData } from '../removeData';
import { clearCurrentUserId } from '../getCurrentUserId';
import { cleanupNotificationSession } from '../sessionCleanup';
import { useChatQueueStore } from '../../store/useChatQueueStore';
import { useReadRoomsStore } from '../../store/useReadRoomsStore';

jest.mock('../auth', () => ({ clearAuthTokens: jest.fn() }));
jest.mock('../removeData', () => ({ removeData: jest.fn() }));
jest.mock('../getCurrentUserId', () => ({ clearCurrentUserId: jest.fn() }));
jest.mock('../sessionCleanup', () => ({ cleanupNotificationSession: jest.fn() }));
jest.mock('@sentry/react-native', () => ({ setUser: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  useChatQueueStore.getState().reset();
  useReadRoomsStore.getState().reset();
});

describe('clearSession', () => {
  it('토큰·memberId·알림 세션·현재 사용자·Sentry 사용자를 모두 정리한다', async () => {
    await clearSession();

    expect(clearAuthTokens).toHaveBeenCalled();
    expect(removeData).toHaveBeenCalledWith('memberId');
    expect(cleanupNotificationSession).toHaveBeenCalled();
    expect(clearCurrentUserId).toHaveBeenCalled();
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it('이전 계정의 채팅 전송 대기열과 읽음 상태를 비운다', async () => {
    useChatQueueStore.getState().addMessage({
      roomId: 1,
      content: '실패한 메시지',
      messageType: 'TEXT',
      imageIds: [],
    });
    useReadRoomsStore.getState().markRead(1, 10);

    await clearSession();

    expect(useChatQueueStore.getState().pendingMessages).toEqual([]);
    expect(useReadRoomsStore.getState().readMessageIds).toEqual({});
  });

  it('QueryClient를 넘기면 조회 캐시도 비운다', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['myProfile'], { memberId: 1 });

    await clearSession(queryClient);

    expect(queryClient.getQueryData(['myProfile'])).toBeUndefined();
  });

  it('일부 정리가 실패해도 나머지는 계속 정리한다', async () => {
    (clearAuthTokens as jest.Mock).mockRejectedValue(new Error('keychain fail'));
    useChatQueueStore.getState().addMessage({
      roomId: 1,
      content: 'x',
      messageType: 'TEXT',
      imageIds: [],
    });

    await expect(clearSession()).resolves.toBeUndefined();

    expect(clearCurrentUserId).toHaveBeenCalled();
    expect(useChatQueueStore.getState().pendingMessages).toEqual([]);
  });
});
