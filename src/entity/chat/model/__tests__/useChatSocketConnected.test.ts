import { act, renderHook } from '@testing-library/react-native';
import { chatSocket } from '~/shared/lib/socket';
import { useChatSocketConnected } from '../useChatSocketConnected';

jest.mock('~/shared/lib/socket', () => {
  const handlers = new Map<string, Set<() => void>>();
  return {
    chatSocket: {
      isConnected: false,
      on: jest.fn((event: string, handler: () => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event)!.add(handler);
      }),
      off: jest.fn((event: string, handler: () => void) => {
        handlers.get(event)?.delete(handler);
      }),
      __emit: (event: string) => handlers.get(event)?.forEach((handler) => handler()),
    },
  };
});

const mockChatSocket = chatSocket as unknown as {
  isConnected: boolean;
  off: jest.Mock;
  __emit: (event: string) => void;
};

beforeEach(() => {
  mockChatSocket.isConnected = false;
});

describe('useChatSocketConnected', () => {
  it('현재 소켓 연결 여부를 돌려준다', () => {
    mockChatSocket.isConnected = true;

    const { result } = renderHook(() => useChatSocketConnected());

    expect(result.current).toBe(true);
  });

  it('connect / disconnect 이벤트가 오면 값을 갱신한다', () => {
    const { result } = renderHook(() => useChatSocketConnected());
    expect(result.current).toBe(false);

    act(() => {
      mockChatSocket.isConnected = true;
      mockChatSocket.__emit('connect');
    });
    expect(result.current).toBe(true);

    act(() => {
      mockChatSocket.isConnected = false;
      mockChatSocket.__emit('disconnect');
    });
    expect(result.current).toBe(false);
  });

  it('언마운트하면 구독을 해제한다', () => {
    const { unmount } = renderHook(() => useChatSocketConnected());

    unmount();

    expect(mockChatSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockChatSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockChatSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });
});
