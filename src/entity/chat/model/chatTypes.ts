import type {
  MessageType,
  RoomId,
  OptionalContent,
  ChatTimestamp,
  ProductImage,
  ChatMessageResponse,
  ChatRoomListItem,
} from '~/shared/types/chatType';

// 서버 응답(wire) 타입은 shared 계층(백그라운드 태스크, 알림 등)에서도 쓰므로 shared/types에 두고
// entity의 공개 API로는 그대로 다시 내보낸다(#741)
export type {
  ProductImage,
  ProductInfo,
  ChatMember,
  ChatRoomListItem,
  ChatMessageResponse,
} from '~/shared/types/chatType';

export interface CreateChatRoomResponse {
  readonly roomId: RoomId;
}

export interface FindChatRoomResponse {
  readonly roomId: RoomId;
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
  // 예약한 시각·거래 완료 시각(School-of-Company/Gwangsan-Server#426). 이 값이 있으면 예약·완료
  // 카드를 그 시각으로 메시지 사이에 끼워 넣고, 없으면(구버전 서버) 목록 맨 끝에 붙인다
  readonly reservedAt?: string | null;
  readonly completedAt?: string | null;
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
