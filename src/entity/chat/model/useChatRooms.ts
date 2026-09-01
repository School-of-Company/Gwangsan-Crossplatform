import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getChatRooms } from '../api/getChatRooms';
import { markChatAsRead } from '../api/markChatAsRead';
import type { ChatRoomListItem, ChatApiError, ChatMessageResponse } from './chatTypes';
import { logger } from '~/shared/lib/logger';
import { useReadRoomsStore } from '~/shared/store/useReadRoomsStore';

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
  const readMessageIds = useReadRoomsStore((state) => state.readMessageIds);

  const query = useQuery({
    queryKey: chatRoomKeys.list(),
    queryFn: getChatRooms,
    enabled,
    refetchInterval,
    staleTime: 10000,
    select: useCallback(
      (data: ChatRoomListItem[]) => {
        const withReadOverride = data.map((room) => {
          const recorded = readMessageIds[String(room.roomId)];
          const isRoomRead = recorded !== undefined && String(recorded) === String(room.messageId);
          return room.unreadMessageCount > 0 && isRoomRead
            ? { ...room, unreadMessageCount: 0 }
            : room;
        });

        // 소켓(updateRoomList)은 UTC(Z 접미사), REST는 로컬 오프셋 없는 문자열이라 raw string
        // 비교로는 순서가 뒤집힐 수 있다 — epoch 기준으로 비교한다 (#533과 동일한 원인)
        const sortedData = [...withReadOverride].sort(
          (a, b) =>
            new Date(b.lastMessageTime ?? 0).getTime() - new Date(a.lastMessageTime ?? 0).getTime()
        );
        return sortedData;
      },
      [readMessageIds]
    ),
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
    (roomId: string | number, updater: (room: ChatRoomListItem) => ChatRoomListItem) => {
      queryClient.setQueryData(chatRoomKeys.list(), (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((room) => (room.roomId === roomId ? updater(room) : room));
      });
    },
    [queryClient]
  );

  const markRoomAsRead = useCallback(
    async (roomId: string | number) => {
      const resetUnreadCount = (readMessageId?: ChatMessageResponse['messageId']) => {
        updateChatRoom(roomId, (room) => {
          const resolvedReadMessageId = readMessageId ?? room.messageId;
          if (resolvedReadMessageId !== undefined) {
            useReadRoomsStore.getState().markRead(roomId, resolvedReadMessageId);
          }
          return { ...room, unreadMessageCount: 0 };
        });
      };

      const messages = queryClient.getQueryData(['chatMessages', roomId]) as
        ChatMessageResponse[] | undefined;
      const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

      if (!lastMessage) {
        resetUnreadCount();
        return;
      }

      try {
        await markChatAsRead(roomId, lastMessage.messageId);
        resetUnreadCount(lastMessage.messageId);
      } catch (error) {
        logger.error('markRoomAsRead failed', error);
        resetUnreadCount(lastMessage.messageId);
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
