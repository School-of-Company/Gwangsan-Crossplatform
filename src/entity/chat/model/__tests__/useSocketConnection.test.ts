import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSocketConnection } from '../useSocketConnection';
import { logger } from '@/shared/lib/logger';
import type { IChatSocketService } from '../../lib/socketService';

jest.mock('@/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}));

const mockUseFocusEffect = useFocusEffect as jest.Mock;

type Handler = (...args: any[]) => void;

const createMockSocketService = (
  overrides: Partial<IChatSocketService> = {}
): IChatSocketService & { __trigger: (event: string, ...args: any[]) => void } => {
  const registered = new Map<string, Set<Handler>>();

  return {
    isConnected: false,
    connectionState: 'disconnected',
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    destroy: jest.fn(),
    sendMessage: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    on: jest.fn((event: string, handler: Handler) => {
      if (!registered.has(event)) registered.set(event, new Set());
      registered.get(event)!.add(handler);
    }),
    off: jest.fn((event: string, handler: Handler) => {
      registered.get(event)?.delete(handler);
    }),
    __trigger: (event: string, ...args: any[]) => {
      registered.get(event)?.forEach((h) => h(...args));
    },
    ...overrides,
  } as IChatSocketService & { __trigger: (event: string, ...args: any[]) => void };
};

describe('useSocketConnection', () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  let removeListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    removeListener = jest.fn();
    appStateListener = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      appStateListener = handler;
      return { remove: removeListener } as any;
    });
    (AppState as { currentState: string }).currentState = 'active';
    mockUseFocusEffect.mockImplementation((cb: () => void) => cb());
  });

  it('초기 connectionState를 socketService로부터 가져온다', () => {
    const socketService = createMockSocketService({ connectionState: 'connected' });
    const { result } = renderHook(() => useSocketConnection({ socketService }));

    expect(result.current.connectionState).toBe('connected');
    expect(result.current.isConnected).toBe(true);
  });

  it('마운트 시 connect/disconnect/connect_error 핸들러를 등록하고 언마운트 시 해제한다', () => {
    const socketService = createMockSocketService();
    const { unmount } = renderHook(() => useSocketConnection({ socketService }));

    expect(socketService.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('connect_error', expect.any(Function));

    unmount();

    expect(socketService.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  it('connect 이벤트가 발생하면 connectionState가 connected로 바뀐다', () => {
    const socketService = createMockSocketService();
    const { result } = renderHook(() => useSocketConnection({ socketService }));

    act(() => {
      socketService.__trigger('connect');
    });

    expect(result.current.connectionState).toBe('connected');
    expect(result.current.isConnected).toBe(true);
  });

  it('disconnect 이벤트가 발생하면 connectionState가 disconnected로 바뀐다', () => {
    const socketService = createMockSocketService();
    const { result } = renderHook(() => useSocketConnection({ socketService }));

    act(() => {
      socketService.__trigger('connect');
    });
    act(() => {
      socketService.__trigger('disconnect', 'transport close');
    });

    expect(result.current.connectionState).toBe('disconnected');
  });

  it('connect_error 이벤트가 발생하면 connectionState가 disconnected로 바뀐다', () => {
    const socketService = createMockSocketService();
    const { result } = renderHook(() => useSocketConnection({ socketService }));

    act(() => {
      socketService.__trigger('connect_error', new Error('fail'));
    });

    expect(result.current.connectionState).toBe('disconnected');
  });

  it('autoConnect가 true이고 연결되어 있지 않으면 마운트 시 connect를 호출한다', async () => {
    const socketService = createMockSocketService({ isConnected: false });
    renderHook(() => useSocketConnection({ socketService, autoConnect: true }));

    await waitFor(() => {
      expect(socketService.connect).toHaveBeenCalled();
    });
  });

  it('autoConnect가 false이면 마운트 시 connect를 호출하지 않는다', () => {
    const socketService = createMockSocketService({ isConnected: false });
    renderHook(() => useSocketConnection({ socketService, autoConnect: false }));

    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it('이미 연결된 상태면 자동 connect를 시도하지 않는다', () => {
    const socketService = createMockSocketService({ isConnected: true });
    renderHook(() => useSocketConnection({ socketService, autoConnect: true }));

    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it('connect 실패 시 logger.error를 호출한다', async () => {
    const socketService = createMockSocketService({
      isConnected: false,
      connect: jest.fn().mockRejectedValue(new Error('boom')),
    });

    renderHook(() => useSocketConnection({ socketService, autoConnect: true }));

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Socket connect failed', expect.any(Error));
    });
  });

  it('화면 포커스 시 연결되어 있지 않으면 connect를 시도한다 (useFocusEffect)', () => {
    const socketService = createMockSocketService({ isConnected: false });
    renderHook(() => useSocketConnection({ socketService, autoConnect: true }));

    expect(mockUseFocusEffect).toHaveBeenCalled();
    expect(socketService.connect).toHaveBeenCalled();
  });

  it('앱이 background/inactive에서 active로 전환되면 재연결을 시도한다', async () => {
    const socketService = createMockSocketService({ isConnected: false });
    renderHook(() => useSocketConnection({ socketService, autoConnect: true }));
    (socketService.connect as jest.Mock).mockClear();

    act(() => {
      appStateListener?.('background');
    });
    act(() => {
      appStateListener?.('active');
    });

    await waitFor(() => {
      expect(socketService.connect).toHaveBeenCalled();
    });
  });

  it('앱이 background에서 active로 전환되어도 이미 연결되어 있으면 재연결을 시도하지 않는다', () => {
    const socketService = createMockSocketService({ isConnected: true });
    renderHook(() => useSocketConnection({ socketService, autoConnect: true }));
    (socketService.connect as jest.Mock).mockClear();

    act(() => {
      appStateListener?.('background');
    });
    act(() => {
      appStateListener?.('active');
    });

    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it('앱 상태 전환에 의한 재연결이 실패하면 logger.error를 호출한다', async () => {
    const socketService = createMockSocketService({ isConnected: false });
    renderHook(() => useSocketConnection({ socketService, autoConnect: true }));
    (socketService.connect as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
    (socketService.connect as jest.Mock).mockRejectedValue(new Error('reconnect boom'));

    act(() => {
      appStateListener?.('background');
    });
    act(() => {
      appStateListener?.('active');
    });

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Socket connect failed', expect.any(Error));
    });
  });

  it('앱 상태 변화 리스너는 언마운트 시 해제된다', () => {
    const socketService = createMockSocketService();
    const { unmount } = renderHook(() => useSocketConnection({ socketService }));

    unmount();

    expect(removeListener).toHaveBeenCalled();
  });

  it('connect/disconnect 호출은 socketService에 위임된다', () => {
    const socketService = createMockSocketService();
    const { result } = renderHook(() => useSocketConnection({ socketService }));

    result.current.connect();
    result.current.disconnect();

    expect(socketService.connect).toHaveBeenCalled();
    expect(socketService.disconnect).toHaveBeenCalled();
  });
});
