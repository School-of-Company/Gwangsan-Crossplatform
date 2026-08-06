import { act, renderHook } from '@testing-library/react-native';
import { useChatSocket } from '../useChatSocket';
import { createChatSocketService } from '../../lib/socketService';
import { createChatSocketManager } from '@/shared/lib/socket';
import { useSocketConnection } from '../useSocketConnection';
import { useMessageSync } from '../useMessageSync';
import { useSocketEventHandlers } from '../useSocketEventHandlers';

jest.mock('@/shared/lib/socket', () => ({
  createChatSocketManager: jest.fn(() => ({})),
}));

const mockChatSocketService = {
  isConnected: false,
  connectionState: 'disconnected',
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendMessage: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('../../lib/socketService', () => ({
  createChatSocketService: jest.fn(() => mockChatSocketService),
}));

const mockConnection = {
  isConnected: false,
  connectionState: 'disconnected' as const,
  connect: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('../useSocketConnection', () => ({
  useSocketConnection: jest.fn(() => mockConnection),
}));

const mockMessageSyncHandlers = {
  handleConnect: jest.fn(),
  handleReceiveMessage: jest.fn(),
  handleUpdateRoomList: jest.fn(),
  handleTransactionStateChanged: jest.fn(),
  markRoomAsRead: jest.fn(),
};

jest.mock('../useMessageSync', () => ({
  useMessageSync: jest.fn(() => mockMessageSyncHandlers),
}));

jest.mock('../useSocketEventHandlers', () => ({
  useSocketEventHandlers: jest.fn(),
}));

const mockUseSocketConnection = useSocketConnection as jest.Mock;
const mockUseMessageSync = useMessageSync as jest.Mock;
const mockUseSocketEventHandlers = useSocketEventHandlers as jest.Mock;

describe('useChatSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatSocketService.isConnected = false;
    mockUseSocketConnection.mockReturnValue(mockConnection);
    mockUseMessageSync.mockReturnValue(mockMessageSyncHandlers);
  });

  it('socketManager와 chatSocketService를 생성한다', () => {
    renderHook(() => useChatSocket());

    expect(createChatSocketManager).toHaveBeenCalledTimes(1);
    expect(createChatSocketService).toHaveBeenCalledTimes(1);
  });

  it('연결된 상태에서 currentRoomId가 있으면 마운트 시 해당 방에 join한다', () => {
    mockChatSocketService.isConnected = true;

    renderHook(() => useChatSocket({ currentRoomId: 7 }));

    expect(mockChatSocketService.joinRoom).toHaveBeenCalledWith(7);
  });

  it('연결되지 않은 상태면 join하지 않는다', () => {
    mockChatSocketService.isConnected = false;

    renderHook(() => useChatSocket({ currentRoomId: 7 }));

    expect(mockChatSocketService.joinRoom).not.toHaveBeenCalled();
  });

  it('currentRoomId가 없으면 join하지 않는다', () => {
    mockChatSocketService.isConnected = true;

    renderHook(() => useChatSocket());

    expect(mockChatSocketService.joinRoom).not.toHaveBeenCalled();
  });

  it('언마운트 시 join했던 방을 leave한다', () => {
    mockChatSocketService.isConnected = true;

    const { unmount } = renderHook(() => useChatSocket({ currentRoomId: 7 }));
    unmount();

    expect(mockChatSocketService.leaveRoom).toHaveBeenCalledWith(7);
  });

  it('currentRoomId가 바뀌면 이전 방을 leave하고 새 방을 join한다', () => {
    mockChatSocketService.isConnected = true;

    const { rerender } = renderHook(
      ({ roomId }: { roomId: number }) => useChatSocket({ currentRoomId: roomId }),
      { initialProps: { roomId: 1 } }
    );

    expect(mockChatSocketService.joinRoom).toHaveBeenCalledWith(1);

    rerender({ roomId: 2 });

    expect(mockChatSocketService.leaveRoom).toHaveBeenCalledWith(1);
    expect(mockChatSocketService.joinRoom).toHaveBeenCalledWith(2);
  });

  it('useSocketEventHandlers에 onConnect로 전달된 콜백은 messageSync의 handleConnect와 joinCurrentRoom을 모두 호출한다', () => {
    mockChatSocketService.isConnected = true;

    renderHook(() => useChatSocket({ currentRoomId: 3 }));

    const call = mockUseSocketEventHandlers.mock.calls[0][0];
    (mockChatSocketService.joinRoom as jest.Mock).mockClear();

    act(() => {
      call.onConnect();
    });

    expect(mockMessageSyncHandlers.handleConnect).toHaveBeenCalledTimes(1);
    expect(mockChatSocketService.joinRoom).toHaveBeenCalledWith(3);
  });

  it('useSocketEventHandlers에 messageSync의 핸들러들을 그대로 전달한다', () => {
    renderHook(() => useChatSocket());

    const call = mockUseSocketEventHandlers.mock.calls[0][0];
    expect(call.onReceiveMessage).toBe(mockMessageSyncHandlers.handleReceiveMessage);
    expect(call.onUpdateRoomList).toBe(mockMessageSyncHandlers.handleUpdateRoomList);
    expect(call.onTransactionStateChanged).toBe(
      mockMessageSyncHandlers.handleTransactionStateChanged
    );
  });

  it('sendMessage는 chatSocketService.sendMessage에 기본값을 채워 위임한다', () => {
    const { result } = renderHook(() => useChatSocket());

    act(() => {
      result.current.sendMessage(5, 'hello');
    });

    expect(mockChatSocketService.sendMessage).toHaveBeenCalledWith({
      roomId: 5,
      content: 'hello',
      messageType: 'TEXT',
      imageIds: [],
    });
  });

  it('sendMessage는 messageType/imageIds를 지정한 값 그대로 전달한다', () => {
    const { result } = renderHook(() => useChatSocket());

    act(() => {
      result.current.sendMessage(5, '', 'IMAGE', [1, 2]);
    });

    expect(mockChatSocketService.sendMessage).toHaveBeenCalledWith({
      roomId: 5,
      content: '',
      messageType: 'IMAGE',
      imageIds: [1, 2],
    });
  });

  it('joinRoom은 연결된 상태에서 chatSocketService.joinRoom에 위임한다', () => {
    mockChatSocketService.isConnected = true;

    const { result } = renderHook(() => useChatSocket());

    act(() => {
      result.current.joinRoom(9);
    });

    expect(mockChatSocketService.joinRoom).toHaveBeenCalledWith(9);
  });

  it('joinRoom은 연결되지 않은 상태면 아무것도 하지 않는다', () => {
    mockChatSocketService.isConnected = false;

    const { result } = renderHook(() => useChatSocket());

    act(() => {
      result.current.joinRoom(9);
    });

    expect(mockChatSocketService.joinRoom).not.toHaveBeenCalled();
  });

  it('leaveRoom은 항상 chatSocketService.leaveRoom에 위임한다', () => {
    const { result } = renderHook(() => useChatSocket());

    act(() => {
      result.current.leaveRoom(9);
    });

    expect(mockChatSocketService.leaveRoom).toHaveBeenCalledWith(9);
  });

  it('connection/messageSync의 값들을 그대로 반환한다', () => {
    mockUseSocketConnection.mockReturnValue({
      ...mockConnection,
      isConnected: true,
      connectionState: 'connected',
    });

    const { result } = renderHook(() => useChatSocket());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
    expect(result.current.markRoomAsRead).toBe(mockMessageSyncHandlers.markRoomAsRead);
    expect(result.current.connect).toBe(mockConnection.connect);
    expect(result.current.disconnect).toBe(mockConnection.disconnect);
  });
});
