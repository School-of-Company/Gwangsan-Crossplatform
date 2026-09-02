import { renderHook } from '@testing-library/react-native';
import { useSocketEventHandlers } from '../useSocketEventHandlers';
import type { IChatSocketService } from '../../lib/socketService';

const createMockSocketService = (): IChatSocketService => ({
  isConnected: false,
  connectionState: 'disconnected',
  connect: jest.fn(),
  disconnect: jest.fn(),
  destroy: jest.fn(),
  sendMessage: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
});

describe('useSocketEventHandlers', () => {
  it('전달된 핸들러만 등록한다', () => {
    const socketService = createMockSocketService();
    const onConnect = jest.fn();
    const onReceiveMessage = jest.fn();

    renderHook(() => useSocketEventHandlers({ socketService, onConnect, onReceiveMessage }));

    expect(socketService.on).toHaveBeenCalledWith('connect', onConnect);
    expect(socketService.on).toHaveBeenCalledWith('receiveMessage', onReceiveMessage);
    expect(socketService.on).toHaveBeenCalledTimes(2);
  });

  it('모든 핸들러를 전달하면 5개 이벤트 모두 등록한다', () => {
    const socketService = createMockSocketService();
    const handlers = {
      onConnect: jest.fn(),
      onReceiveMessage: jest.fn(),
      onUpdateRoomList: jest.fn(),
      onTransactionStateChanged: jest.fn(),
      onError: jest.fn(),
    };

    renderHook(() => useSocketEventHandlers({ socketService, ...handlers }));

    expect(socketService.on).toHaveBeenCalledWith('connect', handlers.onConnect);
    expect(socketService.on).toHaveBeenCalledWith('receiveMessage', handlers.onReceiveMessage);
    expect(socketService.on).toHaveBeenCalledWith('updateRoomList', handlers.onUpdateRoomList);
    expect(socketService.on).toHaveBeenCalledWith(
      'transactionStateChanged',
      handlers.onTransactionStateChanged
    );
    expect(socketService.on).toHaveBeenCalledWith('error', handlers.onError);
    expect(socketService.on).toHaveBeenCalledTimes(5);
  });

  it('언마운트 시 onError 핸들러도 해제한다', () => {
    const socketService = createMockSocketService();
    const onError = jest.fn();

    const { unmount } = renderHook(() => useSocketEventHandlers({ socketService, onError }));

    unmount();

    expect(socketService.off).toHaveBeenCalledWith('error', onError);
  });

  it('핸들러를 아무것도 전달하지 않으면 아무 이벤트도 등록하지 않는다', () => {
    const socketService = createMockSocketService();

    renderHook(() => useSocketEventHandlers({ socketService }));

    expect(socketService.on).not.toHaveBeenCalled();
  });

  it('언마운트 시 등록했던 핸들러를 모두 해제한다', () => {
    const socketService = createMockSocketService();
    const onConnect = jest.fn();
    const onReceiveMessage = jest.fn();

    const { unmount } = renderHook(() =>
      useSocketEventHandlers({ socketService, onConnect, onReceiveMessage })
    );

    unmount();

    expect(socketService.off).toHaveBeenCalledWith('connect', onConnect);
    expect(socketService.off).toHaveBeenCalledWith('receiveMessage', onReceiveMessage);
    expect(socketService.off).toHaveBeenCalledTimes(2);
  });

  it('핸들러가 변경되면 이전 핸들러를 해제하고 새 핸들러를 등록한다', () => {
    const socketService = createMockSocketService();
    const onConnect1 = jest.fn();
    const onConnect2 = jest.fn();

    const { rerender } = renderHook(
      ({ onConnect }: { onConnect: () => void }) =>
        useSocketEventHandlers({ socketService, onConnect }),
      { initialProps: { onConnect: onConnect1 } }
    );

    rerender({ onConnect: onConnect2 });

    expect(socketService.off).toHaveBeenCalledWith('connect', onConnect1);
    expect(socketService.on).toHaveBeenCalledWith('connect', onConnect2);
  });
});
