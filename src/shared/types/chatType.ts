import { ImageType } from './imageType';

export type ChatImage = ImageType;

export interface ChatMember {
  readonly memberId: number;
  readonly nickname: string;
}

export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export type RoomId = number & { readonly __brand: 'RoomId' };
export type MessageId = number & { readonly __brand: 'MessageId' };
export type ProductId = number & { readonly __brand: 'ProductId' };

export type ChatTimestamp = string;
export type OptionalContent = string | null;

export interface BaseSocketMessage {
  readonly roomId: RoomId;
  readonly content: OptionalContent;
  readonly messageType: MessageType;
}

export interface BaseSocketEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

export interface SocketConnectionConfig {
  readonly url: string;
  readonly transports: readonly string[];
  readonly timeout: number;
  readonly reconnection: boolean;
  readonly autoConnect: boolean;
}

export interface ISocketManager {
  readonly isConnected: boolean;
  readonly connectionState: 'disconnected' | 'connecting' | 'connected';
  
  connect(): Promise<void>;
  disconnect(): void;
  emit(event: string, ...args: any[]): void;
  on<T = any>(event: string, handler: (data: T) => void): void;
  off<T = any>(event: string, handler: (data: T) => void): void;
}
