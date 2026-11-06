import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getChatRoomData, CHAT_MESSAGE_PAGE_SIZE } from '../api/getChatMessages';
import {
  addMessageToPages,
  flattenMessagePages,
  keepNewestPage,
  mapMessagePages,
  mergeNewerCachedMessages,
  toMessagePage,
  type ChatMessagePage,
  type ChatMessagePageCursor,
  type ChatMessagePages,
} from '../lib/messageCache';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { ChatMessageResponse } from './chatTypes';
import type { RoomId } from '~/shared/types/chatType';
import { chatMessageKeys, chatRoomDataKeys } from './chatQueryKeys';

export { chatMessageKeys };

interface UseChatMessagesOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface EnhancedChatMessage extends ChatMessageResponse {
  status?: (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];
  tempId?: string;
}

export const useChatMessages = (roomId: RoomId, options: UseChatMessagesOptions = {}) => {
  const { enabled = true, refetchInterval } = options;

  const queryClient = useQueryClient();

  const pendingMessages = useChatQueueStore(
    useShallow((state) => state.pendingMessages.filter((msg) => msg.roomId === roomId))
  );

  const query = useInfiniteQuery({
    queryKey: chatMessageKeys.room(roomId),
    // 최신 페이지는 메시지와 거래 상품(useChatRoomData)이 같은 GET /chat/{roomId} 응답에서 나온다.
    // 직접 요청하지 않고 chatRoomData 쿼리를 거쳐, 같은 응답을 받는 요청(채팅 목록의 진입 전 프리페치,
    // useChatRoomData의 마운트 조회)이 이미 진행 중이면 그 요청에 합류한다. staleTime: 0이라
    // 이미 끝난 캐시만 있을 때는 새로 받아오므로, 아래 refetchOnMount: 'always'의 의도는 그대로다.
    // 그보다 오래된 페이지는 커서로 직접 요청한다.
    queryFn: async ({ pageParam }): Promise<ChatMessagePage> => {
      if (pageParam === null) {
        const data = await queryClient.fetchQuery({
          queryKey: chatRoomDataKeys.room(roomId),
          queryFn: () => getChatRoomData(roomId),
          staleTime: 0,
        });
        return mergeNewerCachedMessages(
          toMessagePage(data.messages, CHAT_MESSAGE_PAGE_SIZE),
          queryClient.getQueryData<ChatMessagePages>(chatMessageKeys.room(roomId))
        );
      }
      const data = await getChatRoomData(roomId, { cursor: pageParam });
      return toMessagePage(data.messages, CHAT_MESSAGE_PAGE_SIZE);
    },
    initialPageParam: null as ChatMessagePageCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!roomId,
    refetchInterval,
    staleTime: 5000,
    // 재입장 프리페치 캐시가 최신 메시지를 놓쳤을 수 있어 staleTime과 무관하게 항상 재조회한다
    refetchOnMount: 'always',
  });

  // 위로 스크롤해 쌓은 이전 페이지는 방을 나가면 버린다. 남겨 두면 재입장 때마다(refetchOnMount)
  // 쌓인 페이지 수만큼 요청이 다시 나간다
  useEffect(
    () => () => {
      queryClient.setQueryData<ChatMessagePages>(chatMessageKeys.room(roomId), keepNewestPage);
    },
    [queryClient, roomId]
  );

  const serverMessages = useMemo(() => flattenMessagePages(query.data), [query.data]);

  const allMessages: EnhancedChatMessage[] = useMemo(() => {
    const sentMessages: EnhancedChatMessage[] = serverMessages.map((msg) => ({
      ...msg,
      status: MESSAGE_STATUS.SENT,
    }));

    const pendingAsMessages: EnhancedChatMessage[] = pendingMessages.map((pending) => ({
      messageId: pending.tempId,
      roomId: pending.roomId,
      content: pending.content,
      messageType: pending.messageType,
      createdAt: pending.createdAt,
      images: pending.images ?? pending.imageIds.map((id) => ({ imageId: id, imageUrl: '' })),
      senderNickname: '나',
      senderId: -1,
      checked: false,
      isMine: true,
      status: pending.status,
      tempId: pending.tempId,
    }));

    return [...sentMessages, ...pendingAsMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [serverMessages, pendingMessages]);

  const { myMessages, otherMessages } = useMemo(() => {
    if (!allMessages) return { myMessages: [], otherMessages: [] };

    return allMessages.reduce(
      (acc, message) => {
        if (message.isMine) {
          acc.myMessages.push(message);
        } else {
          acc.otherMessages.push(message);
        }
        return acc;
      },
      { myMessages: [] as EnhancedChatMessage[], otherMessages: [] as EnhancedChatMessage[] }
    );
  }, [allMessages]);

  const addMessage = useCallback(
    (newMessage: ChatMessageResponse) => {
      queryClient.setQueryData<ChatMessagePages>(chatMessageKeys.room(roomId), (oldData) =>
        addMessageToPages(oldData, newMessage)
      );
    },
    [queryClient, roomId]
  );

  const updateMessage = useCallback(
    (messageId: number, updater: (message: ChatMessageResponse) => ChatMessageResponse) => {
      queryClient.setQueryData<ChatMessagePages>(chatMessageKeys.room(roomId), (oldData) =>
        mapMessagePages(oldData, (messages) =>
          messages.some((message) => message.messageId === messageId)
            ? messages.map((message) =>
                message.messageId === messageId ? updater(message) : message
              )
            : messages
        )
      );
    },
    [queryClient, roomId]
  );

  const invalidateMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatMessageKeys.room(roomId) });
  }, [queryClient, roomId]);

  const lastMessage = useMemo(() => {
    if (!allMessages || allMessages.length === 0) return null;
    return allMessages[allMessages.length - 1];
  }, [allMessages]);

  return {
    ...query,
    data: allMessages,
    myMessages,
    otherMessages,
    lastMessage,
    addMessage,
    updateMessage,
    invalidateMessages,
  };
};
