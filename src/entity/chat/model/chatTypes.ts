import type {
  ChatImage,
  MessageType,
  RoomId,
  MessageId,
  ChatTimestamp,
  OptionalContent,
} from '../../../shared/types/chatType';

export interface CreateChatRoomResponse {
  readonly roomId: RoomId;
}

export interface FindChatRoomResponse {
  readonly roomId: RoomId;
}

export interface ProductImage {
  readonly imageId: number;
  readonly imageUrl: string;
}

export interface ProductInfo {
  readonly productId: string | number;
  readonly title: string;
  readonly images: readonly ProductImage[];
}

export interface TradeProduct {
  readonly id: number;
  readonly title: string;
  readonly images: readonly ProductImage[];
  readonly createdAt: string | null;
  readonly isSeller: boolean;
  readonly isCompletable: boolean;
}

export interface ChatRoomWithProduct {
  readonly product: TradeProduct | null;
  readonly messages: readonly ChatMessageResponse[];
}

export const isTradeProduct = (value: unknown): value is TradeProduct => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'images' in value &&
    'createdAt' in value &&
    'isSeller' in value &&
    'isCompletable' in value &&
    typeof (value as any).id === 'number' &&
    typeof (value as any).title === 'string' &&
    Array.isArray((value as any).images) &&
    typeof (value as any).isSeller === 'boolean' &&
    typeof (value as any).isCompletable === 'boolean'
  );
};

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
}

export interface SendMessagePayload {
  readonly roomId: RoomId;
  readonly content: OptionalContent;
  readonly imageIds: readonly number[];
  readonly messageType: MessageType;
}

export interface ChatRoomsQueryData {
  readonly data: readonly ChatRoomListItem[];
  readonly lastUpdated: ChatTimestamp;
}

export interface ChatMessagesQueryData {
  readonly data: readonly ChatMessageResponse[];
  readonly hasNextPage: boolean;
  readonly nextCursor?: string;
}

export interface ChatApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
}

export type ChatRoomListData = readonly ChatRoomListItem[];
export type ChatMessagesData = readonly ChatMessageResponse[];

export const isChatRoomListItem = (value: unknown): value is ChatRoomListItem => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'roomId' in value &&
    'member' in value &&
    'lastMessage' in value
  );
};

export const isChatMessageResponse = (value: unknown): value is ChatMessageResponse => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'messageId' in value &&
    'roomId' in value &&
    'messageType' in value
  );
};
