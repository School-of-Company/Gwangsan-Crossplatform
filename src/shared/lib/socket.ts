import { io, Socket } from 'socket.io-client';
import { getData } from './getData';
import { API_BASE_URL } from '~/shared/consts/api';
import * as Sentry from '@sentry/react-native';
import {
  CHAT_SOCKET_EVENTS,
  CHAT_SOCKET_SERVER_EVENTS,
  type ISocketManager,
  type SocketConnectionConfig,
} from '~/shared/types/chatType';
import { logger } from './logger';
import { isNetworkOrTimeoutError } from './errorHandler';
import { refreshAccessToken } from './tokenRefresh';

// axios.ts를 import하면 axios → clearSession → sessionCleanup → socket → axios 순환이 생겨
// 모듈 평가 시점에 baseURL이 undefined가 되고, 상대 경로 '/chat'이 Metro 개발 서버로 연결된다.
const SOCKET_URL = API_BASE_URL.replace(/\/$/, '') + '/chat';

// 채팅 서버 핸드셰이크 미들웨어가 토큰 검증 실패 시 next(error)로 돌려주는 메시지
// (Gwangsan-Chatting-Server auth.service.ts validateToken). 재발급으로 해결될 수 있는 경우만 모았다
const SOCKET_AUTH_ERROR_MESSAGES = new Set([
  '만료된 토큰입니다.',
  '유효하지 않은 토큰입니다.',
  '로그아웃된 토큰입니다.',
  '인증에 실패했습니다.',
]);

export const isSocketAuthError = (error: unknown): boolean =>
  error instanceof Error && SOCKET_AUTH_ERROR_MESSAGES.has(error.message);

class SocketManager implements ISocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private isConnecting = false;
  // disconnect()나 새 connect()가 끼어들면 증가해, 진행 중이던 연결 시도가 소켓을 만들지 않게 한다
  private connectGeneration = 0;
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

  connect(): Promise<void> {
    return this.openConnection(false);
  }

  private async openConnection(isAuthRetry: boolean): Promise<void> {
    if (this.isConnecting || this.socket?.connected) return;
    this.isConnecting = true;
    const generation = ++this.connectGeneration;
    const isCurrent = () => generation === this.connectGeneration;

    try {
      const accessToken = await getData('accessToken');
      if (!isCurrent()) return;
      if (!accessToken) {
        throw new Error('Access token not found');
      }

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(this.config.url, {
        // 로그아웃으로 토큰이 지워졌으면 이전 토큰으로 대신 보내지 않는다. 서버가 거부하면 재연결도 멈춘다
        auth: async (cb: (data: Record<string, unknown>) => void) => {
          const latestToken = await getData('accessToken').catch(() => null);
          cb(latestToken ? { token: `Bearer ${latestToken}` } : {});
        },
        transports: [...this.config.transports],
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
          if (isCurrent()) this.isConnecting = false;
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
          // socket.io는 서버 미들웨어가 거부한 연결을 자동으로 다시 시도하지 않는다.
          // 재발급 후 한 번만 다시 연결하고, 그 연결이 또 거부되면 멈춘다
          if (!isAuthRetry && isSocketAuthError(error)) {
            void this.reconnectAfterRefresh(generation);
          }
        });
      });
    } catch (error) {
      if (isCurrent()) this.isConnecting = false;
      logger.error('Socket connection error', error);
      throw error;
    }
  }

  private async reconnectAfterRefresh(generation: number): Promise<void> {
    try {
      await refreshAccessToken('Socket handshake rejected');
    } catch (error) {
      // 세션 만료 처리(로그아웃 안내)는 다음 API 요청의 401 흐름이 맡는다
      Sentry.addBreadcrumb({
        category: 'socket',
        message: `Socket token refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        level: 'warning',
      });
      return;
    }

    if (generation !== this.connectGeneration) return;
    await this.openConnection(true).catch(() => {});
  }

  private setupBasicEventListeners(): void {
    const socket = this.socket;
    if (!socket) return;

    CHAT_SOCKET_SERVER_EVENTS.forEach((event) => {
      socket.on(event, (...args: unknown[]) => {
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
    if (isSocketAuthError(error)) {
      Sentry.addBreadcrumb({
        category: 'socket',
        message: `Socket connect_error due to auth: ${error.message}`,
        level: 'warning',
      });
      this.emit('connect_error', error);
      return;
    }

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

    // 소켓은 로그인 직후·포그라운드 복귀마다 백그라운드로 재연결하므로, 실패를 토스트로 띄우면
    // 소켓과 무관한 동작 직후에도 오류가 뜬다. 연결 상태는 채팅 화면의 connectionState로 알린다.
    this.emit('connect_error', error);
  }

  private static readonly RESERVED_EVENTS = new Set<string>(CHAT_SOCKET_EVENTS);

  emit(event: string, ...args: unknown[]): void {
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

  on<T = unknown>(event: string, handler: (data: T) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<T = unknown>(event: string, handler: (data: T) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  disconnect(): void {
    this.connectGeneration++;
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

export const getChatSocketManager = (): ISocketManager => {
  const config: SocketConnectionConfig = {
    url: SOCKET_URL,
    // 운영 프록시(nginx)가 WebSocket 업그레이드를 그대로 통과시키므로 HTTP long-polling 핸드셰이크를
    // 거치지 않고 바로 WebSocket으로 연결한다. 채팅 서버는 단일 인스턴스라 polling용 sticky session도 필요 없다
    transports: ['websocket'],
    timeout: 15000,
    reconnection: true,
    autoConnect: true,
  };

  return SocketManager.getInstance(config);
};

export const chatSocket = getChatSocketManager();
