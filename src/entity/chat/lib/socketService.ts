import type { ISocketManager, BaseSocketMessage, RoomId } from '@/shared/types/chatType';
import type { ChatMessageResponse } from '../model/chatTypes';
import { logger } from '@/shared/lib/logger';

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
}

export interface ChatSendMessagePayload extends BaseSocketMessage {
  readonly imageIds: readonly number[];
}

export interface IChatSocketService {
  readonly isConnected: boolean;
  readonly connectionState: 'disconnected' | 'connecting' | 'connected';

  connect(): Promise<void>;
  disconnect(): void;
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

  const setupSocketEventForwarding = (): void => {
    socketManager.on('connect', () => {
      emit('connect');
    });

    socketManager.on('disconnect', (reason: string) => {
      emit('disconnect', reason);
    });

    socketManager.on('connect_error', (error: Error) => {
      emit('connect_error', error);
    });

    socketManager.on('receiveMessage', (message: ChatMessageResponse) => {
      emit('receiveMessage', message);
    });

    socketManager.on('updateRoomList', (data: any) => {
      emit('updateRoomList', data);
    });
  };

  setupSocketEventForwarding();

  const connect = async (): Promise<void> => {
    return socketManager.connect();
  };

  const disconnect = (): void => {
    socketManager.disconnect();
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
    sendMessage,
    joinRoom,
    leaveRoom,
    on,
    off,
  };
};
