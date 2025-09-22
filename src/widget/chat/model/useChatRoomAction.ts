import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import Toast from 'react-native-toast-message';
import { useChatMessages } from '~/entity/chat';
import { useChatSocket } from '~/entity/chat/model/useChatSocket';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { extractOtherUserInfo, ensureMessagesArray } from '~/shared/lib/userUtils';
import type { RoomId } from '~/shared/types/chatType';
import type { ChatMessageResponse } from '~/entity/chat';

interface UseChatRoomActionParams {
  readonly roomId: RoomId;
}

export const useChatRoomAction = ({ roomId }: UseChatRoomActionParams) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList | null>(null);

  const { data: messages, isLoading, isError } = useChatMessages(roomId);
  const { data: roomData } = useChatRoomData({ roomId });

  const safeMessages = ensureMessagesArray(messages);
  const otherUserInfo = extractOtherUserInfo(safeMessages);

  const { sendMessage, markRoomAsRead, connectionState } = useChatSocket({
    currentRoomId: roomId,
    chatRoomQueryKey: ['chatRooms', 'list'],
    chatMessageQueryKey: ['chatMessages', roomId],
  });


  const scrollToEnd = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  const messageHandlers = {
    sendMessage: useCallback(
      (content: string | null, imageIds: number[]) => {
        if (connectionState !== 'connected') return;

        if (imageIds.length > 0) {
          sendMessage(roomId, content, 'IMAGE', imageIds);
        } else if (content) {
          sendMessage(roomId, content, 'TEXT', []);
        }
      },
      [roomId, sendMessage, connectionState]
    ),

    renderMessage: useCallback(({ item }: { item: ChatMessageResponse }) => {
      return null;
    }, []),
  };

  const navigationHandlers = {
    goToProfile: useCallback(
      (userId: number) => {
        router.push(`/profile/${userId}`);
      },
      [router]
    ),

    goToOtherUserProfile: useCallback(() => {
      if (otherUserInfo.id) {
        router.push(`/profile/${otherUserInfo.id}`);
      }
    }, [otherUserInfo.id, router]),
  };

  const formatLastMessageDate = useCallback(() => {
    if (safeMessages.length === 0) return '대화를 시작해보세요';

    const lastMessage = safeMessages[safeMessages.length - 1];
    return new Date(lastMessage.createdAt).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, [safeMessages]);

  const hasTradeRequest =
    roomData?.product?.createdAt !== null && roomData?.product?.createdAt !== undefined;

  const shouldShowButtons = hasTradeRequest && roomData?.product?.isCompletable;

  const handleTradeAccept = useCallback(async () => {
    if (!roomData?.product?.id || !otherUserInfo.id) return;

    try {
      await requestTrade({
        productId: roomData.product.id,
        otherMemberId: otherUserInfo.id,
      });

      Toast.show({
        type: 'success',
        text1: '거래가 수락되었습니다!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 수락 실패',
        text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    }
  }, [roomData?.product?.id, otherUserInfo.id]);

  const handleReservation = useCallback(() => {}, []);

  const tradeEmbedConfig = {
    shouldShow: hasTradeRequest,
    product: roomData?.product,
    onTradeAccept: shouldShowButtons ? handleTradeAccept : undefined,
    onReservation: shouldShowButtons ? handleReservation : undefined,
    showButtons: shouldShowButtons,
    isLoading: false,
    requestorNickname: otherUserInfo.nickname,
  };

  useEffect(() => {
    if (roomId) {
      markRoomAsRead(roomId).catch(console.error);
    }
  }, [roomId, markRoomAsRead]);

  useEffect(() => {
    if (safeMessages.length > 0) {
      setTimeout(() => scrollToEnd(true), 100);
    }
  }, [safeMessages.length, scrollToEnd]);

  const componentState = {
    hasMessages: safeMessages.length > 0,
    canSendMessage: connectionState === 'connected',
    headerTitle: otherUserInfo.nickname,
  };

  return {
    flatListRef,

    messages: safeMessages,
    roomData,
    otherUserInfo,
    isLoading,
    isError,
    messageHandlers,
    navigationHandlers,
    tradeEmbedConfig,
    formatLastMessageDate,
    scrollToEnd,
    componentState,
  };
};
