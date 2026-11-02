import { act, renderHook } from '@testing-library/react-native';
import { chatSocket } from '~/shared/lib/socket';
import {
  useChatQueueStore,
  MESSAGE_STATUS,
  type PendingMessage,
} from '~/shared/store/useChatQueueStore';
import { useChatQueueRecovery } from '../useChatQueueRecovery';
import { useChatSocketConnected } from '../useChatSocketConnected';
import { hasActiveAutoRetryOwner } from '../useResilientMessageSender';

jest.mock('~/shared/lib/socket', () => {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  return {
    chatSocket: {
      emit: jest.fn(),
      on: jest.fn((event: string, handler: (payload: unknown) => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event)!.add(handler);
      }),
      off: jest.fn((event: string, handler: (payload: unknown) => void) => {
        handlers.get(event)?.delete(handler);
      }),
      __receive: (event: string, payload: unknown) =>
        handlers.get(event)?.forEach((handler) => handler(payload)),
    },
  };
});

jest.mock('../useChatSocketConnected', () => ({ useChatSocketConnected: jest.fn() }));

jest.mock('../useResilientMessageSender', () => ({
  SEND_TIMEOUT_MS: 10000,
  hasActiveAutoRetryOwner: jest.fn(() => false),
}));

const mockSocket = chatSocket as unknown as {
  emit: jest.Mock;
  __receive: (event: string, payload: unknown) => void;
};
const mockUseChatSocketConnected = useChatSocketConnected as jest.Mock;
const mockHasActiveAutoRetryOwner = hasActiveAutoRetryOwner as jest.Mock;

const makePending = (overrides: Partial<PendingMessage> = {}): PendingMessage => ({
  tempId: 'temp-1',
  roomId: 1,
  content: '재시작 전에 못 보낸 메시지',
  messageType: 'TEXT',
  imageIds: [],
  status: MESSAGE_STATUS.PENDING,
  createdAt: '2026-11-01T00:00:00.000Z',
  retryCount: 0,
  ...overrides,
});

const statusOf = (tempId: string) =>
  useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId)?.status;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockUseChatSocketConnected.mockReturnValue(true);
  mockHasActiveAutoRetryOwner.mockReturnValue(false);
  useChatQueueStore.setState({ pendingMessages: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useChatQueueRecovery', () => {
  it('복원된 대기 메시지를 소켓이 연결되면 보낸다(채팅방을 열지 않아도)', async () => {
    useChatQueueStore.setState({
      pendingMessages: [
        makePending({ tempId: 'text' }),
        makePending({ tempId: 'image', messageType: 'IMAGE', content: null, imageIds: [7] }),
      ],
    });
    await act(async () => {
      await useChatQueueStore.persist.rehydrate();
    });

    renderHook(() => useChatQueueRecovery());

    expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', {
      roomId: 1,
      content: '재시작 전에 못 보낸 메시지',
      messageType: 'TEXT',
      imageIds: [],
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', {
      roomId: 1,
      content: '',
      messageType: 'IMAGE',
      imageIds: [7],
    });
    expect(statusOf('text')).toBe(MESSAGE_STATUS.SENDING);
  });

  it('연결되지 않았으면 보내지 않고, 연결되면 그때 보낸다', () => {
    mockUseChatSocketConnected.mockReturnValue(false);
    useChatQueueStore.setState({ pendingMessages: [makePending()] });

    const { rerender } = renderHook(() => useChatQueueRecovery());
    expect(mockSocket.emit).not.toHaveBeenCalled();

    mockUseChatSocketConnected.mockReturnValue(true);
    rerender({});

    expect(mockSocket.emit).toHaveBeenCalledTimes(1);
  });

  it('채팅방 화면이 열려 있는 방은 그 화면이 보내므로 건드리지 않는다', () => {
    mockHasActiveAutoRetryOwner.mockImplementation((roomId) => roomId === 1);
    useChatQueueStore.setState({
      pendingMessages: [makePending({ tempId: 'owned' }), makePending({ tempId: 'b', roomId: 2 })],
    });

    renderHook(() => useChatQueueRecovery());

    expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'sendMessage',
      expect.objectContaining({ roomId: 2 })
    );
    expect(statusOf('owned')).toBe(MESSAGE_STATUS.PENDING);
  });

  it('실패(FAILED)한 메시지는 중복 전송을 피하려 자동으로 다시 보내지 않는다', () => {
    useChatQueueStore.setState({
      pendingMessages: [makePending({ status: MESSAGE_STATUS.FAILED })],
    });

    renderHook(() => useChatQueueRecovery());

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('echo가 오면 대기열에서 지운다', () => {
    useChatQueueStore.setState({ pendingMessages: [makePending()] });
    renderHook(() => useChatQueueRecovery());

    act(() => {
      mockSocket.__receive('receiveMessage', {
        messageId: 100,
        roomId: 1,
        content: '재시작 전에 못 보낸 메시지',
        messageType: 'TEXT',
        isMine: true,
      });
    });

    expect(useChatQueueStore.getState().pendingMessages).toHaveLength(0);
  });

  it('상대가 보낸 같은 내용의 메시지로는 지우지 않는다', () => {
    useChatQueueStore.setState({ pendingMessages: [makePending()] });
    renderHook(() => useChatQueueRecovery());

    act(() => {
      mockSocket.__receive('receiveMessage', {
        messageId: 100,
        roomId: 1,
        content: '재시작 전에 못 보낸 메시지',
        messageType: 'TEXT',
        isMine: false,
      });
    });

    expect(useChatQueueStore.getState().pendingMessages).toHaveLength(1);
  });

  it('응답이 제한 시간 안에 오지 않으면 FAILED로 바꾼다(연결이 다시 끊겨도)', () => {
    useChatQueueStore.setState({ pendingMessages: [makePending()] });
    const { rerender } = renderHook(() => useChatQueueRecovery());

    mockUseChatSocketConnected.mockReturnValue(false);
    rerender({});
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(statusOf('temp-1')).toBe(MESSAGE_STATUS.FAILED);
  });
});
