import type { RoomId } from '@/shared/types/chatType';
import type {
  ChatMessageResponse,
  ChatRoomListItem,
  ChatRoomWithProduct,
} from '../model/chatTypes';
import { isSystemMessage } from './messagePolicy';
import { isSameMessageId, type MessageUpdatedPayload } from './messageCache';
import type { TransactionStateChangedPayload } from './socketService';

export interface RoomListUpdatePayload {
  readonly roomId: number;
  readonly lastMessage: string;
  readonly lastMessageType: string;
  readonly lastMessageTime: string;
}

// 새 메시지를 채팅 목록 미리보기·안 읽은 수에 반영한다. 이미 반영했거나 목록보다 오래된 메시지는 무시한다
export const applyIncomingMessageToRooms = (
  rooms: ChatRoomListItem[] | undefined,
  message: ChatMessageResponse,
  currentRoomId: RoomId | undefined
): ChatRoomListItem[] | undefined => {
  if (!rooms) return rooms;

  return rooms.map((room) => {
    if (room.roomId !== message.roomId) return room;
    if (room.messageId === message.messageId) return room;

    const incomingTime = new Date(message.createdAt).getTime();
    const lastTime = new Date(room.lastMessageTime).getTime();
    const isStale = Number.isFinite(lastTime) && incomingTime < lastTime;
    if (isStale) return room;

    const isActiveRoom = room.roomId === currentRoomId;
    // SYSTEM 메시지는 상대가 보낸 대화가 아니므로 안 읽은 수를 늘리지 않는다
    const nextUnreadCount = isActiveRoom
      ? 0
      : message.isMine || isSystemMessage(message)
        ? room.unreadMessageCount
        : room.unreadMessageCount + 1;

    return {
      ...room,
      messageId: message.messageId,
      lastMessage: message.content || '(사진)',
      lastMessageType: message.messageType,
      lastMessageTime: message.createdAt,
      unreadMessageCount: nextUnreadCount,
    };
  });
};

export const applyRoomListUpdate = (
  rooms: ChatRoomListItem[] | undefined,
  data: RoomListUpdatePayload
): ChatRoomListItem[] | undefined => {
  if (!rooms) return rooms;

  return rooms.map((room) =>
    room.roomId === data.roomId
      ? {
          ...room,
          lastMessage: data.lastMessage,
          lastMessageType: data.lastMessageType as ChatRoomListItem['lastMessageType'],
          lastMessageTime: data.lastMessageTime,
        }
      : room
  );
};

// 거래 상태 변경을 채팅방 데이터의 상품 카드에 반영한다. 상품이 아직 캐시에 없으면(처음 생기는 거래 요청)
// 그대로 두고 patched: false를, 예약 여부가 바뀌었으면 reservationChanged: true를 알려 호출부가
// 방 데이터를 다시 받아오게 한다
export const patchRoomProductTransaction = (
  roomData: ChatRoomWithProduct | undefined,
  data: TransactionStateChangedPayload
): { next: ChatRoomWithProduct | undefined; patched: boolean; reservationChanged: boolean } => {
  if (!roomData?.product) return { next: roomData, patched: false, reservationChanged: false };

  const reservationChanged =
    typeof data.isReserved === 'boolean' && data.isReserved !== roomData.product.isReserved;
  return {
    patched: true,
    reservationChanged,
    next: {
      ...roomData,
      product: {
        ...roomData.product,
        isCompleted: data.isCompleted,
        isCompletable:
          data.isCompletable ??
          (!data.isCompleted &&
            (data.requestedBySeller == null ||
              data.requestedBySeller !== roomData.product.isSeller)),
        ...(typeof data.isReserved === 'boolean' ? { isReserved: data.isReserved } : {}),
        // 거래 취소 시 서버가 createdAt: null을 보내므로 무조건 대입해야 반영된다
        createdAt: data.createdAt ?? null,
      },
    },
  };
};

export const applyTransactionStateToRooms = (
  rooms: ChatRoomListItem[] | undefined,
  data: TransactionStateChangedPayload
): ChatRoomListItem[] | undefined => {
  if (!rooms) return rooms;

  let hasChange = false;
  const nextData = rooms.map((room) => {
    if (room.roomId !== data.roomId || !room.product) return room;
    if (
      room.product.isCompleted === data.isCompleted &&
      (typeof data.isReserved !== 'boolean' || room.product.isReserved === data.isReserved)
    ) {
      return room;
    }

    hasChange = true;
    return {
      ...room,
      product: {
        ...room.product,
        isCompleted: data.isCompleted,
        ...(typeof data.isReserved === 'boolean' ? { isReserved: data.isReserved } : {}),
      },
    };
  });

  return hasChange ? nextData : rooms;
};

// 수정된 메시지가 목록의 마지막 메시지면 미리보기도 바꾼다
export const applyMessageEditToRooms = (
  rooms: ChatRoomListItem[] | undefined,
  data: Pick<MessageUpdatedPayload, 'roomId' | 'messageId' | 'content'>
): ChatRoomListItem[] | undefined =>
  rooms?.map((room) =>
    room.roomId === data.roomId && isSameMessageId(room.messageId, data.messageId)
      ? { ...room, lastMessage: data.content }
      : room
  );

export const isLastMessageOfRoom = (
  rooms: readonly ChatRoomListItem[] | undefined,
  roomId: RoomId,
  messageId: ChatMessageResponse['messageId']
) =>
  Boolean(
    rooms?.some((room) => room.roomId === roomId && isSameMessageId(room.messageId, messageId))
  );
