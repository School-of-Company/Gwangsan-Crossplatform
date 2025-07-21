import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getChatMessages } from '../api/getChatMessages';
import type { ChatMessageResponse, ChatApiError } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';

export const chatMessageKeys = {
  all: ['chatMessages'] as const,
  room: (roomId: RoomId) => [...chatMessageKeys.all, roomId] as const,
} as const;

interface UseChatMessagesOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onError?: (error: ChatApiError) => void;
} 

export const useChatMessages = (roomId: RoomId, options: UseChatMessagesOptions = {}) => {
  const { enabled = true, refetchInterval, onError } = options;

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatMessageKeys.room(roomId),
    queryFn: () => getChatMessages(roomId),
    enabled: enabled && !!roomId,
    refetchInterval,
    staleTime: 5000,
    select: useCallback((data: ChatMessageResponse[]) => {
      return [...data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }, []),
  });

  if (query.error && onError) {
    onError(query.error as ChatApiError);
  }

  const { myMessages, otherMessages } = useMemo(() => {
    if (!query.data) return { myMessages: [], otherMessages: [] };

    return query.data.reduce(
      (acc, message) => {
        if (message.isMine) {
          acc.myMessages.push(message);
        } else {
          acc.otherMessages.push(message);
        }
        return acc;
      },
      { myMessages: [] as ChatMessageResponse[], otherMessages: [] as ChatMessageResponse[] }
    );
  }, [query.data]);

  const addMessage = useCallback(
    (newMessage: ChatMessageResponse) => {
      queryClient.setQueryData(
        chatMessageKeys.room(roomId),
        (oldData: ChatMessageResponse[] | undefined) => {
          if (!oldData) return [newMessage];

          const exists = oldData.some((msg) => msg.messageId === newMessage.messageId);
          if (exists) return oldData;

          return [...oldData, newMessage].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      );
    },
    [queryClient, roomId]
  );

  const updateMessage = useCallback(
    (messageId: number, updater: (message: ChatMessageResponse) => ChatMessageResponse) => {
      queryClient.setQueryData(
        chatMessageKeys.room(roomId),
        (oldData: ChatMessageResponse[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((message) =>
            message.messageId === messageId ? updater(message) : message
          );
        }
      );
    },
    [queryClient, roomId]
  );

  const invalidateMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatMessageKeys.room(roomId) });
  }, [queryClient, roomId]);

  const lastMessage = useMemo(() => {
    if (!query.data || query.data.length === 0) return null;
    return query.data[query.data.length - 1];
  }, [query.data]);

  return {
    ...query,
    myMessages,
    otherMessages,
    lastMessage,
    addMessage,
    updateMessage,
    invalidateMessages,
  };
};
