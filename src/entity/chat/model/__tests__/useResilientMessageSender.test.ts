import { act, renderHook } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import {
  useResilientMessageSender,
  getAutoRetryDelay,
  MAX_AUTO_RETRY_COUNT,
} from '../useResilientMessageSender';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import { logger } from '~/shared/lib/logger';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

const resetStore = () => {
  useChatQueueStore.setState({ pendingMessages: [] });
};

describe('useResilientMessageSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('연결된 상태면 메시지를 큐에 추가하고 SENDING 상태로 전송한다', () => {
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage('hello', 'TEXT');
    });

    expect(socketSendMessage).toHaveBeenCalledWith(1, 'hello', 'TEXT', []);
    const messages = useChatQueueStore.getState().pendingMessages;
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ roomId: 1, content: 'hello', messageType: 'TEXT' });
  });

  it('연결되지 않은 상태면 PENDING 상태로만 두고 소켓 전송을 시도하지 않는다', () => {
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: false, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage('hello', 'TEXT');
    });

    expect(socketSendMessage).not.toHaveBeenCalled();
    const messages = useChatQueueStore.getState().pendingMessages;
    expect(messages[0].status).toBe(MESSAGE_STATUS.PENDING);
  });

  it('content가 없고 IMAGE 타입이면 빈 문자열을 전송한다(공백을 채우지 않는다)', () => {
    // 서버는 IMAGE 타입에 content를 요구하지 않으므로 공백을 채워 보낼 필요가 없다 — 공백은
    // truthy라 그대로 저장·echo되면 사진 밑에 빈 캡션 말풍선이 매번 뜨는 원인이 된다.
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage(null, 'IMAGE', [10]);
    });

    expect(socketSendMessage).toHaveBeenCalledWith(1, '', 'IMAGE', [10]);
  });

  it('content가 없고 TEXT 타입이면 빈 문자열을 전송한다', () => {
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage(null, 'TEXT');
    });

    expect(socketSendMessage).toHaveBeenCalledWith(1, '', 'TEXT', []);
  });

  it('전송 후 타임아웃 내에 상태가 바뀌지 않으면 FAILED로 전환하고 실패 토스트를 띄운다', async () => {
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    await act(async () => {
      result.current.sendMessage('hello', 'TEXT');
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    const messages = useChatQueueStore.getState().pendingMessages;
    expect(messages[0].status).toBe(MESSAGE_STATUS.FAILED);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '메시지 전송 실패' })
    );

    const tempId = messages[0].tempId;
    const toastCall = (Toast.show as jest.Mock).mock.calls[0][0];
    act(() => {
      toastCall.onPress();
    });

    // retry()가 재연결 상태에서 즉시 재전송을 시도하므로 SENDING으로 전환된다
    const retried = useChatQueueStore.getState().pendingMessages[0];
    expect(retried.tempId).toBe(tempId);
    expect(retried.retryCount).toBe(1);
    expect(retried.status).toBe(MESSAGE_STATUS.SENDING);
  });

  it('타임아웃 전에 상태가 SENDING이 아니게 바뀌면 FAILED로 전환하지 않는다', async () => {
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    await act(async () => {
      result.current.sendMessage('hello', 'TEXT');
      await Promise.resolve();
    });

    const tempId = useChatQueueStore.getState().pendingMessages[0].tempId;
    act(() => {
      useChatQueueStore.getState().setStatus(tempId, MESSAGE_STATUS.SENT);
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    const message = useChatQueueStore.getState().pendingMessages[0];
    expect(message.status).toBe(MESSAGE_STATUS.SENT);
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('타임아웃 전에 메시지가 큐에서 제거되면 FAILED 처리를 하지 않는다', async () => {
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    await act(async () => {
      result.current.sendMessage('hello', 'TEXT');
      await Promise.resolve();
    });

    act(() => {
      resetStore();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(useChatQueueStore.getState().pendingMessages).toHaveLength(0);
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('socketSendMessage가 동기 예외를 던지면 FAILED 처리하고 logger.error를 호출한다', () => {
    const socketSendMessage = jest.fn(() => {
      throw new Error('send failed');
    });
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage('hello', 'TEXT');
    });

    expect(logger.error).toHaveBeenCalledWith('Message send failed', expect.any(Error));
    expect(useChatQueueStore.getState().pendingMessages[0].status).toBe(MESSAGE_STATUS.FAILED);
    // 서버에 닿지 않은 실패라 바로 토스트를 띄우지 않고 자동 재시도를 먼저 한다
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('emit 실패는 2초·4초·8초 간격으로 세 번 자동 재시도하고, 그래도 실패하면 토스트를 띄운다', () => {
    const socketSendMessage = jest.fn(() => {
      throw new Error('send failed');
    });
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage('hello', 'TEXT');
    });
    expect(socketSendMessage).toHaveBeenCalledTimes(1);

    [2000, 4000, 8000].forEach((delay, index) => {
      act(() => {
        jest.advanceTimersByTime(delay - 1);
      });
      expect(socketSendMessage).toHaveBeenCalledTimes(index + 1);
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(socketSendMessage).toHaveBeenCalledTimes(index + 2);
    });

    const message = useChatQueueStore.getState().pendingMessages[0];
    expect(message.retryCount).toBe(MAX_AUTO_RETRY_COUNT);
    expect(message.status).toBe(MESSAGE_STATUS.FAILED);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '메시지 전송 실패' })
    );

    // 더는 자동으로 다시 보내지 않고, 토스트를 눌러야 다시 시도한다
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(socketSendMessage).toHaveBeenCalledTimes(MAX_AUTO_RETRY_COUNT + 1);

    act(() => {
      (Toast.show as jest.Mock).mock.calls[0][0].onPress();
    });
    expect(socketSendMessage).toHaveBeenCalledTimes(MAX_AUTO_RETRY_COUNT + 2);
  });

  it('자동 재시도 전에 사용자가 지우거나 다른 경로로 전송되면 다시 보내지 않는다', () => {
    let shouldThrow = true;
    const socketSendMessage = jest.fn(() => {
      if (shouldThrow) throw new Error('send failed');
    });
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage('hello', 'TEXT');
    });
    shouldThrow = false;
    act(() => {
      useChatQueueStore.getState().reset();
      jest.advanceTimersByTime(2000);
    });

    expect(socketSendMessage).toHaveBeenCalledTimes(1);
  });

  it('getAutoRetryDelay는 지수적으로 늘고 30초를 넘지 않는다', () => {
    expect(getAutoRetryDelay(0)).toBe(2000);
    expect(getAutoRetryDelay(1)).toBe(4000);
    expect(getAutoRetryDelay(2)).toBe(8000);
    expect(getAutoRetryDelay(10)).toBe(30_000);
  });

  it('재연결되면(false→true) 재시도 가능한 메시지를 모두 retry하고 안내 토스트를 띄운다', () => {
    useChatQueueStore.setState({
      pendingMessages: [
        {
          tempId: 'a',
          roomId: 1,
          content: 'hi',
          messageType: 'TEXT',
          imageIds: [],
          status: MESSAGE_STATUS.FAILED,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        },
      ],
    });

    const socketSendMessage = jest.fn();
    const { rerender } = renderHook(
      ({ isSocketConnected }: { isSocketConnected: boolean }) =>
        useResilientMessageSender({ roomId: 1, isSocketConnected, socketSendMessage }),
      { initialProps: { isSocketConnected: false } }
    );

    rerender({ isSocketConnected: true });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info', text1: '연결 복구' })
    );
    const message = useChatQueueStore.getState().pendingMessages[0];
    expect(message.retryCount).toBe(1);
    expect(message.status).toBe(MESSAGE_STATUS.PENDING);
  });

  it('연결이 계속 유지되는 경우에는 재연결 토스트를 띄우지 않는다', () => {
    const socketSendMessage = jest.fn();
    const { rerender } = renderHook(
      ({ isSocketConnected }: { isSocketConnected: boolean }) =>
        useResilientMessageSender({ roomId: 1, isSocketConnected, socketSendMessage }),
      { initialProps: { isSocketConnected: true } }
    );

    rerender({ isSocketConnected: true });

    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('다른 방(roomId)의 재시도 가능 메시지는 retry하지 않는다', () => {
    useChatQueueStore.setState({
      pendingMessages: [
        {
          tempId: 'other-room',
          roomId: 999,
          content: 'hi',
          messageType: 'TEXT',
          imageIds: [],
          status: MESSAGE_STATUS.FAILED,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        },
      ],
    });

    const socketSendMessage = jest.fn();
    const { rerender } = renderHook(
      ({ isSocketConnected }: { isSocketConnected: boolean }) =>
        useResilientMessageSender({ roomId: 1, isSocketConnected, socketSendMessage }),
      { initialProps: { isSocketConnected: false } }
    );

    rerender({ isSocketConnected: true });

    expect(Toast.show).not.toHaveBeenCalled();
    expect(useChatQueueStore.getState().pendingMessages[0].retryCount).toBe(0);
  });

  it('스토어에 retryCount > 0인 PENDING 메시지가 생기면 연결된 상태에서 재전송을 시도한다', () => {
    const socketSendMessage = jest.fn();
    renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      useChatQueueStore.setState({
        pendingMessages: [
          {
            tempId: 'retry-me',
            roomId: 1,
            content: 'retry content',
            messageType: 'TEXT',
            imageIds: [],
            status: MESSAGE_STATUS.PENDING,
            createdAt: new Date().toISOString(),
            retryCount: 1,
          },
        ],
      });
    });

    expect(socketSendMessage).toHaveBeenCalledWith(1, 'retry content', 'TEXT', []);
  });

  it('같은 roomId로 여러 인스턴스가 동시에 마운트되어도 재시도 트리거는 한 인스턴스만 실행한다', () => {
    // Expo Router 스택에 채팅방/예약/후기 화면이 동시에 남아있으면 이 훅이 같은 roomId로
    // 여러 번 마운트될 수 있다 — 이때 중복 전송되지 않는지 검증한다.
    const socketSendMessageA = jest.fn();
    const socketSendMessageB = jest.fn();

    renderHook(() =>
      useResilientMessageSender({
        roomId: 1,
        isSocketConnected: true,
        socketSendMessage: socketSendMessageA,
      })
    );
    renderHook(() =>
      useResilientMessageSender({
        roomId: 1,
        isSocketConnected: true,
        socketSendMessage: socketSendMessageB,
      })
    );

    act(() => {
      useChatQueueStore.setState({
        pendingMessages: [
          {
            tempId: 'dup-check',
            roomId: 1,
            content: 'retry content',
            messageType: 'TEXT',
            imageIds: [],
            status: MESSAGE_STATUS.PENDING,
            createdAt: new Date().toISOString(),
            retryCount: 1,
          },
        ],
      });
    });

    const totalCalls = socketSendMessageA.mock.calls.length + socketSendMessageB.mock.calls.length;
    expect(totalCalls).toBe(1);
  });
});
