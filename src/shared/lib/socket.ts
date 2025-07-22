import { io, Socket } from 'socket.io-client';
import { getData } from './getData';
import Toast from 'react-native-toast-message';
import type { ISocketManager, SocketConnectionConfig } from '@/shared/types/chatType';

class SocketManager implements ISocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private isConnecting = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private config: SocketConnectionConfig;

  private constructor(config: SocketConnectionConfig) {
    this.config = config;
  }

  static getInstance(config?: SocketConnectionConfig): SocketManager {
    if (!SocketManager.instance) {
      if (!config) {
        throw new Error('SocketManager config required for first initialization');
      }
      SocketManager.instance = new SocketManager(config);
    }
    return SocketManager.instance;
  }

  async connect(): Promise<void> {
    this.isConnecting = true;

    try {
      const accessToken = await getData('accessToken');
      if (!accessToken) {
        throw new Error('Access token not found');
      }

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(this.config.url, {
        auth: {
          token: `Bearer ${accessToken}`,
        },
        transports: this.config.transports as any,
        timeout: this.config.timeout,
        forceNew: true,
        reconnection: this.config.reconnection,
        autoConnect: this.config.autoConnect,
        closeOnBeforeunload: false,
      });

      this.setupBasicEventListeners();

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          this.isConnecting = false;
          reject(new Error('Socket not initialized'));
          return;
        }

        const connectTimeout = setTimeout(() => {
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }, 20000);

        this.socket.on('connect', () => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.emit('connect');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.handleConnectionError(error);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  private setupBasicEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      this.emit('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.emit('connect_error', error);
    });

    this.socket.on('receiveMessage', (...args) => {
      this.emit('receiveMessage', ...args);
    });

    this.socket.on('updateRoomList', (...args) => {
      this.emit('updateRoomList', ...args);
    });
  }

  private handleConnectionError(error: Error): void {
    console.error('Socket connection error:', error);
    this.emit('connect_error', error);

    let errorMessage = error.message;

    if (error.message.includes('timeout')) {
      errorMessage = 'Connection timeout';
    } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
      errorMessage = 'Authentication failed';
    }

    Toast.show({
      type: 'error',
      text1: 'Connection failed',
      text2: errorMessage,
      visibilityTime: 4000,
    });
  }

  emit(event: string, ...args: any[]): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    }

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  on<T = any>(event: string, handler: (data: T) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<T = any>(event: string, handler: (data: T) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.eventHandlers.clear();
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get connectionState(): 'disconnected' | 'connecting' | 'connected' {
    if (this.isConnecting) return 'connecting';
    if (this.socket?.connected) return 'connected';
    return 'disconnected';
  }
}

export const createChatSocketManager = (): ISocketManager => {
  const config: SocketConnectionConfig = {
    url: 'https://api.gwangsan.io.kr/api/chat',
    transports: ['websocket'],
    timeout: 15000,
    reconnection: true,
    autoConnect: true,
  };

  return SocketManager.getInstance(config);
};

export const chatSocket = createChatSocketManager();
