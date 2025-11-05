import { useCallback, useRef, useEffect } from 'react';
import { FlatList } from 'react-native';
import { useChatMessages as useChatMessagesEntity } from '~/entity/chat';
import { useChatSocket } from '~/entity/chat/model/useChatSocket';
import { useResilientMessageSender } from '~/entity/chat/hooks/useResilientMessageSender';
import { extractOtherUserInfo, ensureMessagesArray } from '~/shared/lib/userUtils';
import type { RoomId } from '~/shared/types/chatType';
import type { ChatMessageResponse } from '~/entity/chat';

interface UseChatMessagesParams {
  readonly roomId: RoomId;
}

interface UseChatMessagesReturn {
  readonly flatListRef: React.RefObject<FlatList | null>;
  readonly messages: ChatMessageResponse[];
  readonly otherUserInfo: { nickname: string; id?: number };
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly connectionState: string;
  readonly messageHandlers: {
    readonly sendMessage: (content: string | null, imageIds: number[]) => void;
    readonly renderMessage: ({ item }: { item: ChatMessageResponse }) => null;
  };
  readonly scrollToEnd: (animated?: boolean) => void;
  readonly markRoomAsRead: (roomId: RoomId) => Promise<void>;
}

export const useChatMessages = ({ roomId }: UseChatMessagesParams): UseChatMessagesReturn => {
  const flatListRef = useRef<FlatList | null>(null);

  const { data: messages, isLoading, isError } = useChatMessagesEntity(roomId);
  const { sendMessage: socketSendMessage, markRoomAsRead, connectionState } = useChatSocket({
    currentRoomId: roomId,
    chatRoomQueryKey: ['chatRooms', 'list'],
    chatMessageQueryKey: ['chatMessages', roomId],
  });
  
  const { sendMessage: resilientSendMessage } = useResilientMessageSender({
    roomId,
    isSocketConnected: connectionState === 'connected',
    socketSendMessage,
  });

  const safeMessages = ensureMessagesArray(messages);
  const otherUserInfo = extractOtherUserInfo(safeMessages);

  const scrollToEnd = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);
  
  useEffect(() => {
    if (messages && messages.length > 0) setTimeout(() => scrollToEnd(true), 100);
  }, [messages?.length, scrollToEnd, messages]);

  const messageHandlers = {
    sendMessage: useCallback(
      (content: string | null, imageIds: number[]) => {
        if (imageIds.length > 0) {
          resilientSendMessage(content, 'IMAGE', imageIds);
        } else if (content) {
          resilientSendMessage(content, 'TEXT', []);
        }
      },
      [resilientSendMessage]
    ),

    renderMessage: useCallback(({ item }: { item: ChatMessageResponse }) => {
      return null;
    }, []),
  };

  return {
    flatListRef,
    messages: safeMessages,
    otherUserInfo,
    isLoading,
    isError,
    connectionState,
    messageHandlers,
    scrollToEnd,
    markRoomAsRead,
  };
};
