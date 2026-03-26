import type { RoomId } from '@/shared/types/chatType';

export const chatMessageKeys = {
  all: ['chatMessages'] as const,
  room: (roomId: RoomId) => [...chatMessageKeys.all, roomId] as const,
} as const;
