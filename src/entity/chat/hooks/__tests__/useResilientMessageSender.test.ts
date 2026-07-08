import { act, renderHook } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { useResilientMessageSender } from '../useResilientMessageSender';
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

  it('content가 없고 IMAGE 타입이면 공백 문자를 전송한다', () => {
    const socketSendMessage = jest.fn();
    const { result } = renderHook(() =>
      useResilientMessageSender({ roomId: 1, isSocketConnected: true, socketSendMessage })
    );

    act(() => {
      result.current.sendMessage(null, 'IMAGE', [10]);
    });

    expect(socketSendMessage).toHaveBeenCalledWith(1, ' ', 'IMAGE', [10]);
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
    const messages = useChatQueueStore.getState().pendingMessages;
    expect(messages[0].status).toBe(MESSAGE_STATUS.FAILED);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '메시지 전송 실패' })
    );
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
});
