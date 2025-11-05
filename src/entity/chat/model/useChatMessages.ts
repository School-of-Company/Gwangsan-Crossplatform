import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getChatMessages } from '../api/getChatMessages';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
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

export interface EnhancedChatMessage extends ChatMessageResponse {
  status?: typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];
  tempId?: string;
}

export const useChatMessages = (roomId: RoomId, options: UseChatMessagesOptions = {}) => {
  const { enabled = true, refetchInterval, onError } = options;

  const queryClient = useQueryClient();
  
  const pendingMessages = useChatQueueStore(
    useCallback((state) => state.getByRoom(roomId), [roomId])
  );

  const query = useQuery({
    queryKey: chatMessageKeys.room(roomId),
    queryFn: () => getChatMessages(roomId),
    enabled: enabled && !!roomId,
    refetchInterval,
    staleTime: 5000,
    select: useCallback((data: ChatMessageResponse[] | undefined) => {
      if (!Array.isArray(data)) return [];
      return [...data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }, []),
  });

  if (query.error && onError) {
    onError(query.error as ChatApiError);
  }
  
  const allMessages: EnhancedChatMessage[] = useMemo(() => {
    const serverMessages: EnhancedChatMessage[] = (query.data || []).map(msg => ({
      ...msg,
      status: MESSAGE_STATUS.SENT,
    }));
    
    const pendingAsMessages: EnhancedChatMessage[] = pendingMessages.map(pending => ({
      messageId: pending.tempId,
      roomId: pending.roomId,
      content: pending.content,
      messageType: pending.messageType,
      createdAt: pending.createdAt,
      images: pending.imageIds.map(id => ({ imageId: id, imageUrl: '' })),
      senderNickname: '나',
      senderId: -1,
      checked: false,
      isMine: true,
      status: pending.status,
      tempId: pending.tempId,
    }));
    
    return [...serverMessages, ...pendingAsMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [query.data, pendingMessages]);

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
