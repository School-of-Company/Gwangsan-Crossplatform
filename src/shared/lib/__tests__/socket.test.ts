import Toast from 'react-native-toast-message';

import { io } from 'socket.io-client';
import * as Sentry from '@sentry/react-native';
import { getData } from '../getData';
import { logger } from '../logger';
import { chatSocket } from '../socket';

jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('../axios', () => ({ baseURL: 'https://api.test.com/api' }));
jest.mock('../getData', () => ({ getData: jest.fn() }));
jest.mock('../logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockIo = io as jest.Mock;
const mockGetData = getData as jest.Mock;
const mockSentry = Sentry as jest.Mocked<typeof Sentry>;

function createMockSocket() {
  const handlers: Record<string, ((...args: any[]) => void)[]> = {};
  return {
    connected: false,
    on: jest.fn((event: string, handler: (...args: any[]) => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    }),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
    __trigger(event: string, ...args: any[]) {
      (handlers[event] || []).forEach((h) => h(...args));
    },
  };
}

type MockSocket = ReturnType<typeof createMockSocket>;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function connectSuccessfully(socket: MockSocket, token = 'token-123') {
  mockGetData.mockResolvedValue(token);
  const promise = chatSocket.connect();
  await flush();
  socket.connected = true;
  socket.__trigger('connect');
  await promise;
  return promise;
}

describe('chatSocket (SocketManager singleton)', () => {
  beforeEach(() => {
    chatSocket.disconnect();
    jest.clearAllMocks();
  });

  it('exposes a disconnected state before connecting', () => {
    expect(chatSocket.isConnected).toBe(false);
    expect(chatSocket.connectionState).toBe('disconnected');
  });

  it('connects with the stored access token and resolves on the socket "connect" event', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);

    await connectSuccessfully(socket, 'abc-token');

    expect(mockGetData).toHaveBeenCalledWith('accessToken');
    expect(mockIo).toHaveBeenCalledWith(
      expect.stringContaining('/chat'),
      expect.objectContaining({
        auth: expect.any(Function),
        transports: ['polling', 'websocket'],
        forceNew: true,
      })
    );
    expect(chatSocket.isConnected).toBe(true);
    expect(chatSocket.connectionState).toBe('connected');
  });

  it('auth 콜백은 호출 시점의 액세스 토큰을 다시 읽어 전달한다', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);

    await connectSuccessfully(socket, 'old-token');

    const { auth } = mockIo.mock.calls[0][1];
    mockGetData.mockResolvedValue('new-token');

    const cb = jest.fn();
    auth(cb);
    await flush();

    expect(cb).toHaveBeenCalledWith({ token: 'Bearer new-token' });
  });

  it('auth 콜백은 토큰을 읽지 못하면 최초 연결 토큰으로 대체한다', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);

    await connectSuccessfully(socket, 'abc-token');

    const { auth } = mockIo.mock.calls[0][1];
    mockGetData.mockRejectedValue(new Error('storage unavailable'));

    const cb = jest.fn();
    auth(cb);
    await flush();

    expect(cb).toHaveBeenCalledWith({ token: 'Bearer abc-token' });
  });

  it('reports a "connecting" state while the connection is in flight', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    mockGetData.mockResolvedValue('token');

    const promise = chatSocket.connect();
    expect(chatSocket.connectionState).toBe('connecting');

    await flush();
    socket.__trigger('connect');
    await promise;
  });

  it('rejects when there is no stored access token, without opening a socket', async () => {
    mockGetData.mockResolvedValue(null);

    await expect(chatSocket.connect()).rejects.toThrow('Access token not found');
    expect(mockIo).not.toHaveBeenCalled();
    expect(chatSocket.connectionState).toBe('disconnected');
  });

  it('does not open a second socket while a connection attempt is already in flight', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    mockGetData.mockResolvedValue('token');

    const first = chatSocket.connect();
    const second = chatSocket.connect();
    await expect(second).resolves.toBeUndefined();

    await flush();
    socket.__trigger('connect');
    await first;

    expect(mockIo).toHaveBeenCalledTimes(1);
  });

  it('does not reconnect when already connected', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    await chatSocket.connect();

    expect(mockIo).toHaveBeenCalledTimes(1);
  });

  it('tears down a previous socket before creating a new one on reconnect', async () => {
    const firstSocket = createMockSocket();
    mockIo.mockReturnValue(firstSocket);
    await connectSuccessfully(firstSocket);

    // Simulate the transport dropping without going through chatSocket.disconnect().
    firstSocket.connected = false;
    const secondSocket = createMockSocket();
    mockIo.mockReturnValue(secondSocket);

    await connectSuccessfully(secondSocket, 'token-2');

    expect(firstSocket.removeAllListeners).toHaveBeenCalled();
    expect(firstSocket.disconnect).toHaveBeenCalled();
    expect(mockIo).toHaveBeenCalledTimes(2);
  });

  it('rejects and shows a toast on connect_error, mapping timeout messages', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    mockGetData.mockResolvedValue('token');

    const promise = chatSocket.connect();
    await flush();

    const error = new Error('timeout reached');
    socket.__trigger('connect_error', error);

    await expect(promise).rejects.toBe(error);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text2: 'Connection timeout' })
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('does not report a native socket read failure (e.g. SocketException connection abort) to Sentry', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    const error = new Error('SocketException: Software caused connection abort');
    socket.__trigger('error', error);

    expect(logger.error).not.toHaveBeenCalled();
    expect(mockSentry.captureException).not.toHaveBeenCalled();
    expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'socket',
        message: expect.stringContaining('SocketException'),
      })
    );
  });

  it('reports a non-network "error" event on the socket to Sentry as before', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    const error = new Error('invalid message payload');
    socket.__trigger('error', error);

    expect(logger.error).toHaveBeenCalledWith('Socket server error', error);
    expect(mockSentry.addBreadcrumb).not.toHaveBeenCalled();
  });

  it('maps unauthorized connect_error messages to an authentication-failure toast', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    mockGetData.mockResolvedValue('token');

    const promise = chatSocket.connect();
    await flush();

    const error = new Error('401 unauthorized');
    socket.__trigger('connect_error', error);

    await expect(promise).rejects.toBe(error);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text2: 'Authentication failed' })
    );
  });

  it('forwards socket "disconnect" events to local disconnect handlers', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    const handler = jest.fn();
    chatSocket.on('disconnect', handler);
    socket.__trigger('disconnect', 'transport close');

    expect(handler).toHaveBeenCalledWith('transport close');
  });

  it('forwards socket "receiveMessage" events to local handlers', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    const handler = jest.fn();
    chatSocket.on('receiveMessage', handler);
    socket.__trigger('receiveMessage', { roomId: '1', content: 'hi' });

    expect(handler).toHaveBeenCalledWith({ roomId: '1', content: 'hi' });
  });

  it('registers and removes local event handlers independently of the transport', () => {
    const handler = jest.fn();
    chatSocket.on('customEvent', handler);
    chatSocket.emit('customEvent', 1, 2);
    expect(handler).toHaveBeenCalledWith(1, 2);

    chatSocket.off('customEvent', handler);
    chatSocket.emit('customEvent', 3);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('forwards non-reserved emit calls to the underlying socket only when connected', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    chatSocket.emit('typing', { roomId: '1' });
    expect(socket.emit).toHaveBeenCalledWith('typing', { roomId: '1' });
  });

  it('does not forward emit calls to the underlying socket when disconnected', () => {
    expect(() => chatSocket.emit('typing', { roomId: '1' })).not.toThrow();
  });

  it('never forwards reserved event names to the underlying socket, even when connected', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    chatSocket.emit('connect');
    expect(socket.emit).not.toHaveBeenCalledWith('connect');
  });

  it('rejects with a timeout error if "connect" never fires within 20s', async () => {
    jest.useFakeTimers();
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    mockGetData.mockResolvedValue('token');

    const promise = chatSocket.connect();
    // Attach the rejection handler before advancing timers, otherwise the
    // promise can reject before anything observes it — flagged as an
    // unhandled rejection instead of a clean assertion failure.
    const assertion = expect(promise).rejects.toThrow('Connection timeout');
    // getData('accessToken') resolves as a real microtask before the 20s
    // setTimeout is even registered — flush it before advancing fake timers.
    await Promise.resolve();
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(20000);

    await assertion;
    jest.useRealTimers();
  });

  it('forwards socket "updateRoomList" events to local handlers', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    const handler = jest.fn();
    chatSocket.on('updateRoomList', handler);
    socket.__trigger('updateRoomList', { roomId: '1' });

    expect(handler).toHaveBeenCalledWith({ roomId: '1' });
  });

  it('forwards socket "transactionStateChanged" events to local handlers', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    const handler = jest.fn();
    chatSocket.on('transactionStateChanged', handler);
    socket.__trigger('transactionStateChanged', { state: 'DONE' });

    expect(handler).toHaveBeenCalledWith({ state: 'DONE' });
  });

  it('logs and continues when a local event handler throws', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    const throwingHandler = jest.fn(() => {
      throw new Error('handler boom');
    });
    const okHandler = jest.fn();
    chatSocket.on('customEvent', throwingHandler);
    chatSocket.on('customEvent', okHandler);

    expect(() => chatSocket.emit('customEvent', 1)).not.toThrow();

    expect(logger.error).toHaveBeenCalledWith('Error in customEvent handler', expect.any(Error));
    expect(okHandler).toHaveBeenCalledWith(1);
  });

  it('disconnect tears down the socket and resets state', async () => {
    const socket = createMockSocket();
    mockIo.mockReturnValue(socket);
    await connectSuccessfully(socket);

    chatSocket.disconnect();

    expect(socket.removeAllListeners).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(chatSocket.isConnected).toBe(false);
    expect(chatSocket.connectionState).toBe('disconnected');
  });
});
