import { createChatSocketService } from '../socketService';
import type { ISocketManager } from '@/shared/types/chatType';
import { logger } from '@/shared/lib/logger';

jest.mock('@/shared/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

type MockSocketManager = ISocketManager & {
  __trigger: (event: string, ...args: any[]) => void;
};

const createMockSocketManager = (overrides: Partial<ISocketManager> = {}): MockSocketManager => {
  const registered = new Map<string, Set<Function>>();

  const manager: MockSocketManager = {
    isConnected: false,
    connectionState: 'disconnected',
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn((event: string, handler: Function) => {
      if (!registered.has(event)) registered.set(event, new Set());
      registered.get(event)!.add(handler);
    }),
    off: jest.fn((event: string, handler: Function) => {
      registered.get(event)?.delete(handler);
    }),
    __trigger: (event: string, ...args: any[]) => {
      registered.get(event)?.forEach((handler) => handler(...args));
    },
    ...overrides,
  };

  return manager;
};

describe('createChatSocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('생성 시 socketManager에 모든 forwarding 이벤트를 등록한다', () => {
    const socketManager = createMockSocketManager();

    createChatSocketService(socketManager);

    expect(socketManager.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socketManager.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(socketManager.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(socketManager.on).toHaveBeenCalledWith('receiveMessage', expect.any(Function));
    expect(socketManager.on).toHaveBeenCalledWith('updateRoomList', expect.any(Function));
    expect(socketManager.on).toHaveBeenCalledWith('transactionStateChanged', expect.any(Function));
    expect(socketManager.on).toHaveBeenCalledTimes(6);
  });

  it('connect()는 socketManager.connect()를 호출한다', async () => {
    const socketManager = createMockSocketManager();
    const service = createChatSocketService(socketManager);

    await service.connect();

    expect(socketManager.connect).toHaveBeenCalledTimes(1);
  });

  it('disconnect()는 socketManager.disconnect()를 호출하고 내부 핸들러를 제거한다', () => {
    const socketManager = createMockSocketManager();
    const service = createChatSocketService(socketManager);

    const handler = jest.fn();
    service.on('connect', handler);

    service.disconnect();

    expect(socketManager.disconnect).toHaveBeenCalledTimes(1);

    socketManager.__trigger('connect');
    expect(handler).not.toHaveBeenCalled();
  });

  it('isConnected / connectionState는 socketManager 값을 그대로 위임한다', () => {
    const socketManager = createMockSocketManager({
      isConnected: true,
      connectionState: 'connected',
    });
    const service = createChatSocketService(socketManager);

    expect(service.isConnected).toBe(true);
    expect(service.connectionState).toBe('connected');
  });

  it('on()으로 등록한 핸들러는 socketManager 이벤트 발생 시 호출된다', () => {
    const socketManager = createMockSocketManager();
    const service = createChatSocketService(socketManager);

    const connectHandler = jest.fn();
    const disconnectHandler = jest.fn();
    service.on('connect', connectHandler);
    service.on('disconnect', disconnectHandler);

    socketManager.__trigger('connect');
    socketManager.__trigger('disconnect', 'io server disconnect');

    expect(connectHandler).toHaveBeenCalledTimes(1);
    expect(disconnectHandler).toHaveBeenCalledWith('io server disconnect');
  });

  it('receiveMessage / updateRoomList / transactionStateChanged 이벤트를 그대로 전달한다', () => {
    const socketManager = createMockSocketManager();
    const service = createChatSocketService(socketManager);

    const receiveHandler = jest.fn();
    const updateRoomHandler = jest.fn();
    const transactionHandler = jest.fn();
    service.on('receiveMessage', receiveHandler);
    service.on('updateRoomList', updateRoomHandler);
    service.on('transactionStateChanged', transactionHandler);

    const message = { messageId: 1, content: 'hi' };
    const roomUpdate = {
      roomId: 1,
      lastMessage: 'hi',
      lastMessageType: 'TEXT',
      lastMessageTime: 't',
    };
    const transaction = {
      roomId: 1,
      productId: 2,
      isCompleted: true,
      createdAt: 't',
    };

    socketManager.__trigger('receiveMessage', message);
    socketManager.__trigger('updateRoomList', roomUpdate);
    socketManager.__trigger('transactionStateChanged', transaction);

    expect(receiveHandler).toHaveBeenCalledWith(message);
    expect(updateRoomHandler).toHaveBeenCalledWith(roomUpdate);
    expect(transactionHandler).toHaveBeenCalledWith(transaction);
  });

  it('off()로 핸들러를 해제하면 더 이상 호출되지 않는다', () => {
    const socketManager = createMockSocketManager();
    const service = createChatSocketService(socketManager);

    const handler = jest.fn();
    service.on('connect', handler);
    service.off('connect', handler);

    socketManager.__trigger('connect');

    expect(handler).not.toHaveBeenCalled();
  });

  it('핸들러 실행 중 에러가 발생하면 logger.error를 호출하고 전파하지 않는다', () => {
    const socketManager = createMockSocketManager();
    const service = createChatSocketService(socketManager);

    const throwingHandler = jest.fn(() => {
      throw new Error('boom');
    });
    service.on('connect', throwingHandler);

    expect(() => socketManager.__trigger('connect')).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith('Error in connect handler', expect.any(Error));
  });

  it('sendMessage는 연결되지 않은 상태면 에러를 던진다', () => {
    const socketManager = createMockSocketManager({ isConnected: false });
    const service = createChatSocketService(socketManager);

    expect(() =>
      service.sendMessage({ roomId: 1, content: 'hi', messageType: 'TEXT', imageIds: [] })
    ).toThrow('Socket not connected');
  });

  it('sendMessage는 연결된 상태면 sendMessage 이벤트를 emit한다', () => {
    const socketManager = createMockSocketManager({ isConnected: true });
    const service = createChatSocketService(socketManager);

    service.sendMessage({ roomId: 1, content: 'hi', messageType: 'TEXT', imageIds: [10, 20] });

    expect(socketManager.emit).toHaveBeenCalledWith('sendMessage', {
      roomId: 1,
      content: 'hi',
      messageType: 'TEXT',
      imageIds: [10, 20],
    });
  });

  it('sendMessage는 imageIds가 없으면 빈 배열로 대체한다', () => {
    const socketManager = createMockSocketManager({ isConnected: true });
    const service = createChatSocketService(socketManager);

    service.sendMessage({
      roomId: 1,
      content: null,
      messageType: 'TEXT',
      imageIds: undefined as any,
    });

    expect(socketManager.emit).toHaveBeenCalledWith('sendMessage', {
      roomId: 1,
      content: null,
      messageType: 'TEXT',
      imageIds: [],
    });
  });

  it('joinRoom은 연결되지 않은 상태면 에러를 던진다', () => {
    const socketManager = createMockSocketManager({ isConnected: false });
    const service = createChatSocketService(socketManager);

    expect(() => service.joinRoom(1)).toThrow('Socket not connected');
  });

  it('joinRoom은 연결된 상태면 joinRoom 이벤트를 emit한다', () => {
    const socketManager = createMockSocketManager({ isConnected: true });
    const service = createChatSocketService(socketManager);

    service.joinRoom(42);

    expect(socketManager.emit).toHaveBeenCalledWith('joinRoom', 42);
  });

  it('leaveRoom은 연결되지 않은 상태면 조용히 무시한다', () => {
    const socketManager = createMockSocketManager({ isConnected: false });
    const service = createChatSocketService(socketManager);

    expect(() => service.leaveRoom(1)).not.toThrow();
    expect(socketManager.emit).not.toHaveBeenCalled();
  });

  it('leaveRoom은 연결된 상태면 leaveRoom 이벤트를 emit한다', () => {
    const socketManager = createMockSocketManager({ isConnected: true });
    const service = createChatSocketService(socketManager);

    service.leaveRoom(42);

    expect(socketManager.emit).toHaveBeenCalledWith('leaveRoom', 42);
  });
});
