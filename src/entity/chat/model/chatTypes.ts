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
  readonly isCompleted?: boolean;
  readonly isReserved?: boolean;
  readonly images: readonly ProductImage[];
}

export interface TradeProduct {
  readonly id: number;
  readonly title: string;
  readonly images: readonly ProductImage[];
  readonly createdAt: string | null;
  readonly isSeller: boolean;
  // 게시글 작성자 여부(School-of-Company/Gwangsan-Server#397). 예약 생성 권한은 Mode 기준
  // 판매자(isSeller)가 아니라 게시글 작성자에게만 있어(#357), 예약 관련 버튼 노출은 이 값을
  // 기준으로 삼아야 한다. 서버가 아직 필드를 내려주지 않는 동안은 undefined이므로, 사용하는
  // 쪽에서 `isAuthor ?? isSeller`로 기존 동작을 유지해야 한다(#397 배포 전까지의 임시 fallback).
  readonly isAuthor?: boolean;
  readonly isCompletable: boolean;
  readonly isCompleted: boolean;
  readonly isReserved: boolean;
  readonly reservationScheduledAt?: string | null;
  readonly reservationPlaceName?: string | null;
  readonly reservationAddress?: string | null;
  readonly reservationLatitude?: number | null;
  readonly reservationLongitude?: number | null;
}

export interface ChatRoomWithProduct {
  readonly product: TradeProduct | null;
  readonly messages: readonly ChatMessageResponse[];
}

export const isTradeProduct = (value: unknown): value is TradeProduct => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    'id' in obj &&
    'title' in obj &&
    'images' in obj &&
    'createdAt' in obj &&
    'isSeller' in obj &&
    'isCompletable' in obj &&
    'isCompleted' in obj &&
    'isReserved' in obj &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.images) &&
    typeof obj.isSeller === 'boolean' &&
    typeof obj.isCompletable === 'boolean' &&
    typeof obj.isCompleted === 'boolean' &&
    typeof obj.isReserved === 'boolean'
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
