import { io, Socket } from 'socket.io-client';
import { getData } from './getData';
import Toast from 'react-native-toast-message';
import type { ChatMessageResponse, SendMessagePayload } from '@/entity/chat';

export interface SocketEvents {
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

class ChatSocketManager {
  private static instance: ChatSocketManager;
  private socket: Socket | null = null;
  private isConnecting = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  private constructor() {}

  static getInstance(): ChatSocketManager {
    if (!ChatSocketManager.instance) {
      ChatSocketManager.instance = new ChatSocketManager();
    }
    return ChatSocketManager.instance;
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

      this.socket = io('https://api.gwangsan.io.kr/api/chat', {
        auth: {
          token: `Bearer ${accessToken}`,
        },
        transports: ['websocket'],
        timeout: 15000,
        forceNew: true,
        reconnection: false,
        autoConnect: true,
        closeOnBeforeunload: false,
      });

      this.setupEventListeners();

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
      console.error(error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('receiveMessage', (data: ChatMessageResponse) => {
      this.emit('receiveMessage', data);
    });

    this.socket.on('updateRoomList', (data: any) => {
      this.emit('updateRoomList', data);
    });
  }

  private handleConnectionError(error: Error): void {
    console.error(error);
    this.emit('connect_error', error);

    let errorMessage = error.message;

    if (error.message.includes('timeout')) {
      errorMessage = 'Connection timeout - server may be down';
    } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
      errorMessage = 'Authentication failed - please login again';
    }

    Toast.show({
      type: 'error',
      text1: 'Chat connection failed',
      text2: errorMessage,
      visibilityTime: 4000,
    });
  }

  sendMessage(payload: SendMessagePayload): void {
    if (!this.socket?.connected) {
      Toast.show({
        type: 'error',
        text1: 'Message send failed',
        text2: 'Not connected to chat server',
        visibilityTime: 3000,
      });
      return;
    }

    const message = {
      roomId: payload.roomId,
      content: payload.content,
      messageType: payload.messageType,
      imageIds: payload.imageIds || [],
    };
    this.socket.emit('sendMessage', message);
  }

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`${event}:`, error);
        }
      });
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

export const chatSocket = ChatSocketManager.getInstance();
