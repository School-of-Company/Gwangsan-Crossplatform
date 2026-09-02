import {
  CHAT_SOCKET_EVENTS,
  type ISocketManager,
  type BaseSocketMessage,
  type RoomId,
} from '@/shared/types/chatType';
import type { ChatMessageResponse } from '../model/chatTypes';
import { logger } from '@/shared/lib/logger';

export interface TransactionStateChangedPayload {
  roomId: number;
  targetMemberId?: number;
  productId: number;
  isCompleted: boolean;
  isReserved?: boolean;
  createdAt: string | null;
  // 완료 가능 여부는 보는 사람의 isSeller에 따라 달라져 방 전체 broadcast로 보낼 수 없으므로,
  // 서버가 isCompletable을 보내지 않으면 "누구 쪽에서 요청했는지"로 클라이언트가 계산한다
  isCompletable?: boolean;
  requestedBySeller?: boolean | null;
}

export interface SocketErrorPayload {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ChatSocketEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  receiveMessage: (message: ChatMessageResponse) => void;
  updateRoomList: (data: {
    roomId: number;
    lastMessage: string;
    lastMessageType: string;
    lastMessageTime: string;
  }) => void;
  transactionStateChanged: (data: TransactionStateChangedPayload) => void;
  error: (error: SocketErrorPayload) => void;
}

export interface ChatSendMessagePayload extends BaseSocketMessage {
  readonly imageIds: readonly number[];
}

export interface IChatSocketService {
  readonly isConnected: boolean;
  readonly connectionState: 'disconnected' | 'connecting' | 'connected';

  connect(): Promise<void>;
  disconnect(): void;
  destroy(): void;
  sendMessage(payload: ChatSendMessagePayload): void;
  joinRoom(roomId: RoomId): void;
  leaveRoom(roomId: RoomId): void;

  on<K extends keyof ChatSocketEvents>(event: K, handler: ChatSocketEvents[K]): void;
  off<K extends keyof ChatSocketEvents>(event: K, handler: ChatSocketEvents[K]): void;
}

export const createChatSocketService = (socketManager: ISocketManager): IChatSocketService => {
  const eventHandlers = new Map<string, Set<Function>>();

  const emit = (event: string, ...args: any[]): void => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          logger.error(`Error in ${event} handler`, error);
        }
      });
    }
  };

  const forwardedEvents: readonly (keyof ChatSocketEvents)[] = CHAT_SOCKET_EVENTS;

  const stopForwarding = forwardedEvents.map((event) => {
    const handler = (...args: any[]) => emit(event, ...args);
    socketManager.on(event, handler);
    return () => socketManager.off(event, handler);
  });

  const connect = async (): Promise<void> => {
    return socketManager.connect();
  };

  const disconnect = (): void => {
    socketManager.disconnect();
    eventHandlers.clear();
  };

  const destroy = (): void => {
    stopForwarding.forEach((stop) => stop());
    eventHandlers.clear();
  };

  const sendMessage = (payload: ChatSendMessagePayload): void => {
    if (!socketManager.isConnected) {
      throw new Error('Socket not connected');
    }

    const message = {
      roomId: payload.roomId,
      content: payload.content,
      messageType: payload.messageType,
      imageIds: payload.imageIds || [],
    };

    socketManager.emit('sendMessage', message);
  };

  const on = <K extends keyof ChatSocketEvents>(event: K, handler: ChatSocketEvents[K]): void => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, new Set());
    }
    eventHandlers.get(event)!.add(handler);
  };

  const off = <K extends keyof ChatSocketEvents>(event: K, handler: ChatSocketEvents[K]): void => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  };

  const joinRoom = (roomId: RoomId): void => {
    if (!socketManager.isConnected) {
      throw new Error('Socket not connected');
    }
    socketManager.emit('joinRoom', roomId);
  };

  const leaveRoom = (roomId: RoomId): void => {
    if (!socketManager.isConnected) return;
    socketManager.emit('leaveRoom', roomId);
  };

  return {
    get isConnected() {
      return socketManager.isConnected;
    },
    get connectionState() {
      return socketManager.connectionState;
    },
    connect,
    disconnect,
    destroy,
    sendMessage,
    joinRoom,
    leaveRoom,
    on,
    off,
  };
};
