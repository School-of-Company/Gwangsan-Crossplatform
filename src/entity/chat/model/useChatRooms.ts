import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getChatRooms } from '../api/getChatRooms';
import { markChatAsRead } from '../api/markChatAsRead';
import type { ChatRoomListItem, ChatApiError, ChatMessageResponse } from './chatTypes';
import { logger } from '~/shared/lib/logger';
import { useReadRoomsStore } from '~/shared/store/useReadRoomsStore';
import { chatMessageKeys, chatRoomKeys } from './chatQueryKeys';
import { useChatSocketConnected } from './useChatSocketConnected';
import { getNewestMessage, type ChatMessagePages } from '../lib/messageCache';

export { chatRoomKeys };

// 값이 없거나 파싱 불가능한 날짜 문자열이면 0(가장 오래됨)으로 취급해 정렬이 NaN으로 깨지지 않게 한다
const toSortableTime = (value: string | null | undefined): number => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const CHAT_ROOMS_POLL_INTERVAL = 30 * 1000;

interface UseChatRoomsOptions {
  enabled?: boolean;
  // 지정하지 않으면 소켓이 끊겨 있을 때만 CHAT_ROOMS_POLL_INTERVAL로 폴링한다. 연결돼 있는 동안에는
  // 새 메시지·목록 갱신이 소켓 이벤트로 반영되므로 GET /chat/rooms를 반복하지 않는다
  refetchInterval?: number | false;
  onError?: (error: ChatApiError) => void;
  // 탭바 뱃지처럼 화면 일부만 쓰는 곳은 조회가 실패해도 에러 바운더리로 던지지 않는다(#740)
  throwOnError?: boolean;
}

export const useChatRooms = (options: UseChatRoomsOptions = {}) => {
  const { enabled = true, onError, throwOnError } = options;
  const isSocketConnected = useChatSocketConnected();
  const refetchInterval =
    options.refetchInterval ?? (isSocketConnected ? false : CHAT_ROOMS_POLL_INTERVAL);

  const queryClient = useQueryClient();
  const readMessageIds = useReadRoomsStore((state) => state.readMessageIds);

  const query = useQuery({
    queryKey: chatRoomKeys.list(),
    queryFn: getChatRooms,
    enabled,
    refetchInterval,
    staleTime: 10000,
    ...(throwOnError === undefined ? {} : { throwOnError }),
    // 앱이 백그라운드에서 돌아온 직후 실패했거나 오래된 목록을 바로 다시 받아온다(#724)
    refetchOnWindowFocus: true,
    select: useCallback(
      (data: ChatRoomListItem[]) => {
        const withReadOverride = data.map((room) => {
          const recorded = readMessageIds[String(room.roomId)];
          const isRoomRead = recorded !== undefined && String(recorded) === String(room.messageId);
          return room.unreadMessageCount > 0 && isRoomRead
            ? { ...room, unreadMessageCount: 0 }
            : room;
        });

        // REST/소켓 타임스탬프 형식이 달라 문자열 비교로는 순서가 뒤집힐 수 있다 — epoch로 비교 (#533과 동일)
        const sortedData = [...withReadOverride].sort(
          (a, b) => toSortableTime(b.lastMessageTime) - toSortableTime(a.lastMessageTime)
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

      const lastMessage = getNewestMessage(
        queryClient.getQueryData<ChatMessagePages>(chatMessageKeys.room(roomId))
      );

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
