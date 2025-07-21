import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getChatRooms } from '../api/getChatRooms';
import type { ChatRoomListItem, ChatApiError } from './chatTypes';

export const chatRoomKeys = {
  all: ['chatRooms'] as const,
  list: () => [...chatRoomKeys.all, 'list'] as const,
} as const;

interface UseChatRoomsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onError?: (error: ChatApiError) => void;
}

export const useChatRooms = (options: UseChatRoomsOptions = {}) => {
  const { enabled = true, refetchInterval = 30000, onError } = options;

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatRoomKeys.list(),
    queryFn: getChatRooms,
    enabled,
    refetchInterval,
    staleTime: 10000,
    select: useCallback((data: ChatRoomListItem[]) => {
      return [...data].sort((a, b) => {
        if (a.unreadMessageCount > 0 && b.unreadMessageCount === 0) return -1;
        if (a.unreadMessageCount === 0 && b.unreadMessageCount > 0) return 1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    }, []),
  });

  if (query.error && onError) {
    onError(query.error as ChatApiError);
  }

  const totalUnreadCount = useMemo(() => {
    return query.data?.reduce((total, room) => total + room.unreadMessageCount, 0) ?? 0;
  }, [query.data]);

  const invalidateChatRooms = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatRoomKeys.list() });
  }, [queryClient]);

  const updateChatRoom = useCallback(
    (roomId: number, updater: (room: ChatRoomListItem) => ChatRoomListItem) => {
      queryClient.setQueryData(chatRoomKeys.list(), (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((room) => (room.roomId === roomId ? updater(room) : room));
      });
    },
    [queryClient]
  );

  const markRoomAsRead = useCallback(
    (roomId: number) => {
      updateChatRoom(roomId, (room) => ({
        ...room,
        unreadMessageCount: 0,
      }));
    },
    [updateChatRoom]
  );

  return {
    ...query,
    totalUnreadCount,
    invalidateChatRooms,
    updateChatRoom,
    markRoomAsRead,
  };
};
