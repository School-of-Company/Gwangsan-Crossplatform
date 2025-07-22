import type {
  ChatImage,
  ChatMember,
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

export interface ChatRoomListItem {
  readonly roomId: RoomId;
  readonly member: ChatMember;
  readonly messageId: MessageId;
  readonly lastMessage: string;
  readonly lastMessageType: MessageType;
  readonly lastMessageTime: ChatTimestamp;
  readonly unreadMessageCount: number;
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
