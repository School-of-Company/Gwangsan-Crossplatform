import { renderHook, waitFor } from '@testing-library/react-native';
import { usePathname } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { useGlobalChatNotifications } from '../useGlobalChatNotifications';
import { chatSocket } from '../socket';
import { getData } from '../getData';
import { getCurrentUserId } from '../getCurrentUserId';

jest.mock('expo-router', () => ({ usePathname: jest.fn() }));
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
}));
jest.mock('../socket', () => ({
  chatSocket: {
    isConnected: false,
    connect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));
jest.mock('../getData', () => ({ getData: jest.fn() }));
jest.mock('../getCurrentUserId', () => ({ getCurrentUserId: jest.fn() }));

const mockUsePathname = usePathname as jest.Mock;
const mockChatSocket = chatSocket as unknown as {
  isConnected: boolean;
  connect: jest.Mock;
  on: jest.Mock;
  off: jest.Mock;
};
const mockGetData = getData as jest.Mock;
const mockGetCurrentUserId = getCurrentUserId as jest.Mock;
const mockScheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const mockSetBadgeCountAsync = Notifications.setBadgeCountAsync as jest.Mock;

let appStateListener: ((state: AppStateStatus) => void) | undefined;

const baseMessage = {
  messageId: 1,
  roomId: 5,
  content: '안녕하세요',
  messageType: 'TEXT',
  createdAt: '2026-07-08T00:00:00Z',
  senderNickname: '홍길동',
  senderId: 99,
  checked: false,
  isMine: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePathname.mockReturnValue('/home');
  mockChatSocket.isConnected = false;
  mockChatSocket.connect.mockResolvedValue(undefined);
  mockGetData.mockResolvedValue('token');
  mockGetCurrentUserId.mockResolvedValue(1);
  mockScheduleNotificationAsync.mockResolvedValue(undefined);
  mockSetBadgeCountAsync.mockResolvedValue(undefined);
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    appStateListener = handler;
    return { remove: jest.fn() } as never;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useGlobalChatNotifications', () => {
  it('connects the socket when disconnected and a token is available', async () => {
    renderHook(() => useGlobalChatNotifications());

    await waitFor(() => expect(mockChatSocket.connect).toHaveBeenCalledTimes(1));
  });

  it('does not attempt to reconnect when already connected', async () => {
    mockChatSocket.isConnected = true;

    renderHook(() => useGlobalChatNotifications());
    await Promise.resolve();

    expect(mockGetData).not.toHaveBeenCalled();
    expect(mockChatSocket.connect).not.toHaveBeenCalled();
  });

  it('does not connect when there is no stored access token', async () => {
    mockGetData.mockResolvedValue(null);

    renderHook(() => useGlobalChatNotifications());

    await waitFor(() => expect(mockGetData).toHaveBeenCalledWith('accessToken'));
    expect(mockChatSocket.connect).not.toHaveBeenCalled();
  });

  it('registers the receiveMessage listener on mount and removes it on unmount', () => {
    const { unmount } = renderHook(() => useGlobalChatNotifications());

    expect(mockChatSocket.on).toHaveBeenCalledWith('receiveMessage', expect.any(Function));
    const handler = mockChatSocket.on.mock.calls[0][1];

    unmount();

    expect(mockChatSocket.off).toHaveBeenCalledWith('receiveMessage', handler);
  });

  it('does not notify for messages sent by the current user', async () => {
    mockGetCurrentUserId.mockResolvedValue(99); // matches baseMessage.senderId
    renderHook(() => useGlobalChatNotifications());
    const handler = mockChatSocket.on.mock.calls[0][1];

    await handler(baseMessage);

    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not notify for messages in the room currently being viewed', async () => {
    mockUsePathname.mockReturnValue('/chatting/5');
    renderHook(() => useGlobalChatNotifications());
    const handler = mockChatSocket.on.mock.calls[0][1];

    await handler(baseMessage);

    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules a notification for messages from other users in other rooms', async () => {
    renderHook(() => useGlobalChatNotifications());
    const handler = mockChatSocket.on.mock.calls[0][1];

    await handler(baseMessage);

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: '홍길동',
        body: '안녕하세요',
        data: { roomId: 5 },
      },
      trigger: null,
    });
  });

  it('shows an image placeholder body for IMAGE messages', async () => {
    renderHook(() => useGlobalChatNotifications());
    const handler = mockChatSocket.on.mock.calls[0][1];

    await handler({ ...baseMessage, messageType: 'IMAGE', content: null });

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ body: '사진을 보냈습니다.' }) })
    );
  });

  it('does not notify when the current user id cannot be resolved', async () => {
    mockGetCurrentUserId.mockRejectedValue(new Error('no user'));
    renderHook(() => useGlobalChatNotifications());
    const handler = mockChatSocket.on.mock.calls[0][1];

    await handler(baseMessage);

    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  describe('AppState 연동', () => {
    it('앱이 foreground로 돌아오면 뱃지를 초기화한다', async () => {
      renderHook(() => useGlobalChatNotifications());
      // 마운트 시점의 재연결 시도(getData().then(...))가 아직 진행 중인 채로
      // clearAllMocks가 실행되면, 그 pending microtask가 나중에 실행되며
      // mockChatSocket.connect 호출 횟수를 오염시킨다 — 먼저 정착시킨다.
      await waitFor(() => expect(mockGetData).toHaveBeenCalled());
      jest.clearAllMocks();
      mockGetData.mockResolvedValue('token');

      await appStateListener?.('active');

      expect(mockSetBadgeCountAsync).toHaveBeenCalledWith(0);
    });

    it('background/inactive로 전환되면 아무 것도 하지 않는다', async () => {
      renderHook(() => useGlobalChatNotifications());
      // 마운트 시점의 재연결 시도(getData().then(...))가 아직 진행 중인 채로
      // clearAllMocks가 실행되면, 그 pending microtask가 나중에 실행되며
      // mockChatSocket.connect 호출 횟수를 오염시킨다 — 먼저 정착시킨다.
      await waitFor(() => expect(mockGetData).toHaveBeenCalled());
      jest.clearAllMocks();

      await appStateListener?.('background');

      expect(mockSetBadgeCountAsync).not.toHaveBeenCalled();
      expect(mockGetData).not.toHaveBeenCalled();
    });

    it('foreground 복귀 시 연결이 끊겨 있고 토큰이 있으면 재연결한다', async () => {
      renderHook(() => useGlobalChatNotifications());
      // 마운트 시점의 재연결 시도(getData().then(...))가 아직 진행 중인 채로
      // clearAllMocks가 실행되면, 그 pending microtask가 나중에 실행되며
      // mockChatSocket.connect 호출 횟수를 오염시킨다 — 먼저 정착시킨다.
      await waitFor(() => expect(mockGetData).toHaveBeenCalled());
      jest.clearAllMocks();
      mockChatSocket.isConnected = false;
      mockGetData.mockResolvedValue('token');

      await appStateListener?.('active');
      await waitFor(() => expect(mockChatSocket.connect).toHaveBeenCalledTimes(1));
    });

    it('foreground 복귀 시 이미 연결되어 있으면 재연결을 시도하지 않는다', async () => {
      renderHook(() => useGlobalChatNotifications());
      // 마운트 시점의 재연결 시도(getData().then(...))가 아직 진행 중인 채로
      // clearAllMocks가 실행되면, 그 pending microtask가 나중에 실행되며
      // mockChatSocket.connect 호출 횟수를 오염시킨다 — 먼저 정착시킨다.
      await waitFor(() => expect(mockGetData).toHaveBeenCalled());
      jest.clearAllMocks();
      mockChatSocket.isConnected = true;

      await appStateListener?.('active');

      expect(mockGetData).not.toHaveBeenCalled();
      expect(mockChatSocket.connect).not.toHaveBeenCalled();
    });

    it('foreground 복귀 시 토큰이 없으면 재연결하지 않는다', async () => {
      renderHook(() => useGlobalChatNotifications());
      // 마운트 시점의 재연결 시도(getData().then(...))가 아직 진행 중인 채로
      // clearAllMocks가 실행되면, 그 pending microtask가 나중에 실행되며
      // mockChatSocket.connect 호출 횟수를 오염시킨다 — 먼저 정착시킨다.
      await waitFor(() => expect(mockGetData).toHaveBeenCalled());
      jest.clearAllMocks();
      mockChatSocket.isConnected = false;
      mockGetData.mockResolvedValue(null);

      await appStateListener?.('active');
      await waitFor(() => expect(mockGetData).toHaveBeenCalledWith('accessToken'));

      expect(mockChatSocket.connect).not.toHaveBeenCalled();
    });
  });
});
