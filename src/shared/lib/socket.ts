import { io, Socket } from 'socket.io-client';
import { getData } from './getData';
import { baseURL } from './axios';
import * as Sentry from '@sentry/react-native';
import {
  CHAT_SOCKET_EVENTS,
  CHAT_SOCKET_SERVER_EVENTS,
  type ISocketManager,
  type SocketConnectionConfig,
} from '@/shared/types/chatType';
import { logger } from './logger';
import { isNetworkOrTimeoutError } from './errorHandler';

const SOCKET_URL = (baseURL ?? '').replace(/\/$/, '') + '/chat';

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
    if (this.isConnecting || this.socket?.connected) return;
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
        auth: async (cb: (data: Record<string, unknown>) => void) => {
          const latestToken = await getData('accessToken').catch(() => null);
          cb({ token: `Bearer ${latestToken ?? accessToken}` });
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
      logger.error('Socket connection error', error);
      throw error;
    }
  }

  private setupBasicEventListeners(): void {
    const socket = this.socket;
    if (!socket) return;

    CHAT_SOCKET_SERVER_EVENTS.forEach((event) => {
      socket.on(event, (...args: any[]) => {
        this.emit(event, ...args);
      });
    });

    socket.on('error', (error) => {
      // 이미 연결된 소켓의 읽기/쓰기 도중 기기·네트워크에 의해 강제로 끊어진 경우
      // (예: SocketException: Software caused connection abort)는 앱 버그가
      // 아니므로 Sentry 예외로 남기지 않고 breadcrumb만 남겨 노이즈를 줄인다.
      if (isNetworkOrTimeoutError(error)) {
        Sentry.addBreadcrumb({
          category: 'socket',
          message: `Socket error due to network/timeout: ${error instanceof Error ? error.message : String(error)}`,
          level: 'warning',
        });
        return;
      }
      logger.error('Socket server error', error);
    });
  }

  private handleConnectionError(error: Error): void {
    // 기기 오프라인, NoRouteToHostException, 자체 20s 연결 타임아웃 등 실사용자
    // 네트워크 상태에 의한 연결 실패는 앱 버그가 아니므로 Sentry 예외로 남기지
    // 않고 breadcrumb만 남겨 노이즈를 줄인다.
    if (isNetworkOrTimeoutError(error)) {
      Sentry.addBreadcrumb({
        category: 'socket',
        message: `Socket connect_error due to network/timeout: ${error.message}`,
        level: 'warning',
      });
    } else {
      logger.error('Socket connection error', error);
    }

    // 채팅 소켓은 로그인 직후·화면 이동·앱 포그라운드 복귀 시마다 백그라운드로
    // 자동 재연결을 시도한다(모든 호출부가 실패를 조용히 무시하거나 로깅만
    // 함). 이 실패를 전역 Toast로 노출하면 로그인 등 소켓과 무관한 동작
    // 직후에도 "오류" 토스트가 떠 사용자를 혼란시키므로(#585) 표시하지
    // 않는다. 연결 상태는 채팅 화면의 connectionState 표시(Header dot)로
    // 별도 전달된다.
    this.emit('connect_error', error);
  }

  private static readonly RESERVED_EVENTS = new Set<string>(CHAT_SOCKET_EVENTS);

  emit(event: string, ...args: any[]): void {
    if (this.socket?.connected && !SocketManager.RESERVED_EVENTS.has(event)) {
      this.socket.emit(event, ...args);
    }

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          logger.error(`Error in ${event} handler`, error);
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
    url: SOCKET_URL,
    transports: ['polling', 'websocket'],
    timeout: 15000,
    reconnection: true,
    autoConnect: true,
  };

  return SocketManager.getInstance(config);
};

export const chatSocket = createChatSocketManager();
