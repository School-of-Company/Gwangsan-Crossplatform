import { ImageType } from './imageType';

export type ChatImage = ImageType;

export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export type RoomId = string | number;
export type MessageId = string | number;
export type ProductId = string | number;

export type ChatTimestamp = string;
export type OptionalContent = string | null;

export interface BaseSocketMessage {
  readonly roomId: RoomId;
  readonly content: OptionalContent;
  readonly messageType: MessageType;
}

export const CHAT_SOCKET_SERVER_EVENTS = [
  'disconnect',
  'connect_error',
  'receiveMessage',
  'updateRoomList',
  'transactionStateChanged',
  // 메시지 수정/삭제 실시간 반영(Gwangsan-Chatting-Server#37)
  'messageUpdated',
  'messageDeleted',
  'error',
] as const;

export const CHAT_SOCKET_EVENTS = ['connect', ...CHAT_SOCKET_SERVER_EVENTS] as const;

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

// 채팅 서버 응답 타입. entity/chat/model/chatTypes에서 다시 내보낸다(#741)
export interface ProductImage {
  readonly imageId: number;
  readonly imageUrl: string;
}

export interface ProductInfo {
  readonly productId: string | number;
  readonly title: string;
  readonly isCompleted?: boolean;
  readonly isReserved?: boolean;
  readonly images: readonly ProductImage[];
}

export interface ChatMember {
  memberId: string | number;
  nickname: string;
}

export interface ChatRoomListItem {
  readonly roomId: RoomId;
  readonly member: ChatMember;
  readonly messageId: MessageId;
  readonly lastMessage: string;
  readonly lastMessageType: MessageType;
  readonly lastMessageTime: ChatTimestamp;
  readonly unreadMessageCount: number;
  readonly product: ProductInfo;
}

export interface ChatMessageResponse {
  readonly messageId: MessageId;
  readonly roomId: RoomId;
  readonly content: OptionalContent;
  readonly messageType: MessageType;
  readonly createdAt: ChatTimestamp;
  readonly images?: readonly ChatImage[];
  readonly senderNickname: string;
  readonly senderId: number;
  readonly checked: boolean;
  readonly isMine: boolean;
  // 메시지를 수정한 시각(School-of-Company/Gwangsan-Server#422). 수정한 적이 없으면 비어 있다
  readonly editedAt?: ChatTimestamp | null;
}
