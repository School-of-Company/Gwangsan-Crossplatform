import type { RoomId } from '@/shared/types/chatType';

export const chatMessageKeys = {
  all: ['chatMessages'] as const,
  room: (roomId: RoomId) => [...chatMessageKeys.all, roomId] as const,
} as const;

// 채팅방 REST 응답(GET /chat/{roomId}) 전체({ product, messages })를 담는 캐시
export const chatRoomDataKeys = {
  room: (roomId: RoomId) => ['chatRoomData', roomId] as const,
} as const;
