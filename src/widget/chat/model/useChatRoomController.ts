import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { useAnimatedRef, type AnimatedRef } from 'react-native-reanimated';
import {
  useChatMessages as useChatMessagesEntity,
  chatMessageKeys,
  chatRoomKeys,
} from '~/entity/chat';
import { useChatSocket } from '~/entity/chat/model/useChatSocket';
import { useResilientMessageSender } from '~/entity/chat/model/useResilientMessageSender';
import { useChatOtherUser } from '~/entity/chat/model/useChatOtherUser';
import { ensureMessagesArray } from '~/shared/lib/userUtils';
import type { RoomId } from '~/shared/types/chatType';
import type { ChatMessageResponse } from '~/entity/chat';
import type { PendingMessageImage } from '~/shared/store/useChatQueueStore';

interface UseChatRoomControllerParams {
  readonly roomId: RoomId;
}

interface UseChatRoomControllerReturn {
  readonly flatListRef: AnimatedRef<FlatList>;
  readonly messages: ChatMessageResponse[];
  readonly otherUserInfo: { nickname: string; id?: number };
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => void;
  readonly connectionState: 'connected' | 'connecting' | 'disconnected';
  readonly isBlockedByOtherUser: boolean;
  readonly messageHandlers: {
    readonly sendMessage: (
      content: string | null,
      imageIds: number[],
      images?: PendingMessageImage[]
    ) => void;
  };
  readonly scrollToEnd: (animated?: boolean) => void;
  readonly markRoomAsRead: (roomId: RoomId) => Promise<void>;
  readonly olderMessages: {
    readonly hasMore: boolean;
    readonly isLoading: boolean;
    readonly load: () => void;
  };
}

const CHAT_ROOM_QUERY_KEY = chatRoomKeys.list();

export const useChatRoomController = ({
  roomId,
}: UseChatRoomControllerParams): UseChatRoomControllerReturn => {
  const flatListRef = useAnimatedRef<FlatList>();

  const {
    data: messages,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatMessagesEntity(roomId);

  const chatMessageQueryKey = useMemo(() => chatMessageKeys.room(roomId), [roomId]);

  const {
    sendMessage: socketSendMessage,
    markRoomAsRead,
    connectionState,
    isBlockedByOtherUser,
  } = useChatSocket({
    currentRoomId: roomId,
    chatRoomQueryKey: CHAT_ROOM_QUERY_KEY,
    chatMessageQueryKey,
  });

  const { sendMessage: resilientSendMessage } = useResilientMessageSender({
    roomId,
    isSocketConnected: connectionState === 'connected',
    socketSendMessage,
  });

  const safeMessages = ensureMessagesArray(messages);

  const otherUserInfo = useChatOtherUser(roomId, safeMessages);

  // 메시지 목록은 inverted FlatList라 offset 0이 가장 최근 메시지(화면 맨 아래)다. 새 메시지가
  // 와도 여기서 강제로 내리지 않는다 — 바닥 근처일 때만 목록이 스스로 따라 내려간다(ChatRoomContent)
  const scrollToEnd = useCallback(
    (animated = true) => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated });
    },
    [flatListRef]
  );

  const loadOlderMessages = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const olderMessages = useMemo(
    () => ({
      hasMore: Boolean(hasNextPage),
      isLoading: isFetchingNextPage,
      load: loadOlderMessages,
    }),
    [hasNextPage, isFetchingNextPage, loadOlderMessages]
  );

  const messageHandlers = {
    sendMessage: useCallback(
      (content: string | null, imageIds: number[], images?: PendingMessageImage[]) => {
        if (imageIds.length > 0) {
          resilientSendMessage(content, 'IMAGE', imageIds, images);
        } else if (content) {
          resilientSendMessage(content, 'TEXT', []);
        }
      },
      [resilientSendMessage]
    ),
  };

  return {
    flatListRef,
    messages: safeMessages,
    otherUserInfo,
    isLoading,
    isError,
    refetch,
    connectionState,
    isBlockedByOtherUser,
    messageHandlers,
    scrollToEnd,
    markRoomAsRead,
    olderMessages,
  };
};
