import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getChatRooms } from '../api/getChatRooms';
import { markChatAsRead } from '../api/markChatAsRead';
import type { ChatRoomListItem, ChatApiError, ChatMessageResponse } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';

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
      const sortedData = [...data].sort((a, b) => {
        if (a.unreadMessageCount > 0 && b.unreadMessageCount === 0) return -1;
        if (a.unreadMessageCount === 0 && b.unreadMessageCount > 0) return 1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      return sortedData;
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
    async (roomId: RoomId) => {
      const messages = queryClient.getQueryData(['chatMessages', roomId]) as
        | ChatMessageResponse[]
        | undefined;
      const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

      if (!lastMessage) {
        updateChatRoom(roomId, (room) => ({
          ...room,
          unreadMessageCount: 0,
        }));
        return;
      }

      try {
        await markChatAsRead(roomId, lastMessage.messageId);

        updateChatRoom(roomId, (room) => ({
          ...room,
          unreadMessageCount: 0,
        }));
      } catch (error) {
        console.error(error);
        updateChatRoom(roomId, (room) => ({
          ...room,
          unreadMessageCount: 0,
        }));
      }
    },
    [updateChatRoom, queryClient]
  );

  return {
    ...query,
    totalUnreadCount,
    invalidateChatRooms,
    updateChatRoom,
    markRoomAsRead,
  };
};
