import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useChatNavigation } from '~/widget/chat/model/useChatNavigation';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { useChatUIState } from '~/widget/chat/model/useChatUIState';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { ChatRoomHeader } from '@/widget/chat/ui/ChatRoomHeader';
import { ChatRoomContent } from '@/widget/chat/ui/ChatRoomContent';
import { TradeRequestModal } from '@/widget/chat/ui/TradeRequestModal';
import { Header } from '@/shared/ui/Header';
import { ChatInput } from '@/widget/chat';
import type { RoomId } from '@/shared/types/chatType';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';
import { createReview } from '~/entity/post/api/createReview';
import ReviewsModal from '~/entity/post/ui/ReviewsModal';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;

  const [isTradeRequestModalVisible, setIsTradeRequestModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewLight, setReviewLight] = useState<number>(60);
  const [reviewContents, setReviewContents] = useState('');

  const {
    flatListRef,
    messages,
    otherUserInfo,
    isLoading,
    isError,
    connectionState,
    messageHandlers,
    scrollToEnd,
    markRoomAsRead,
  } = useChatMessages({ roomId });

  const { navigationHandlers, formatLastMessageDate } = useChatNavigation({
    otherUserInfo,
  });

  const { data: roomData } = useChatRoomData({ roomId });

  const {
    handleTradeAccept,
    handleReservation,
    handleCancelReservation,
    hasTradeRequest,
    shouldShowButtons,
  } = useTradeHandlers({
    roomData: roomData || null,
    otherUserInfo,
  });

  const { tradeEmbedConfig, menuConfig, tradeRequestInfo, componentState } = useChatUIState({
    roomId,
    otherUserInfo,
    hasTradeRequest,
    shouldShowButtons,
    handleTradeAccept,
    handleReservation,
    handleCancelReservation,
  });

  const updatedComponentState = useMemo(
    () => ({
      ...componentState,
      hasMessages: messages.length > 0,
      canSendMessage: connectionState === 'connected',
    }),
    [componentState, messages.length, connectionState]
  );

  useEffect(() => {
    if (roomId) {
      markRoomAsRead(roomId).catch(console.error);
    }
  }, [roomId, markRoomAsRead]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToEnd(true), 100);
    }
  }, [messages.length, scrollToEnd]);

  const { handleTradeRequest: executeTradeRequest, isLoading: isTradeRequestLoading } =
    useTradeRequest({
      productId: tradeRequestInfo.productId || 0,
      sellerId: tradeRequestInfo.sellerId || 0,
    });

  const handleMenuPress = useCallback(() => {
    setIsTradeRequestModalVisible(true);
  }, []);

  const handleTradeRequest = useCallback(async () => {
    try {
      await executeTradeRequest();
      setIsTradeRequestModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  }, [executeTradeRequest]);

  const handleReviewSubmit = useCallback(
    async (light: number, contents: string) => {
      if (!roomData?.product?.id) return;

      try {
        await createReview({
          productId: roomData.product.id,
          content: contents,
          light: light,
        });
        setIsReviewModalVisible(false);
        setReviewLight(60);
        setReviewContents('');
      } catch (error) {
        console.error('리뷰 작성 실패:', error);
      }
    },
    [roomData?.product?.id]
  );

  const handleReviewButtonPress = useCallback(() => {
    setIsReviewModalVisible(true);
  }, []);

  const renderHeader = () => (
    <ChatRoomHeader
      otherUserNickname={otherUserInfo.nickname}
      otherUserId={otherUserInfo.id}
      lastMessageDate={formatLastMessageDate(messages)}
      onProfilePress={navigationHandlers.goToOtherUserProfile}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">Failed to load chat room</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        headerTitle={updatedComponentState.headerTitle}
        onMenuPress={handleMenuPress}
        showMenuButton={menuConfig.shouldShowMenuButton}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}>
        <ChatRoomContent
          messages={messages}
          hasMessages={updatedComponentState.hasMessages}
          flatListRef={flatListRef}
          renderHeader={renderHeader}
          onProfilePress={navigationHandlers.goToProfile}
          onScrollToEnd={() => scrollToEnd(true)}
          tradeEmbedConfig={tradeEmbedConfig}
          onReviewButtonPress={handleReviewButtonPress}
          showReviewButton={roomData?.product?.isCompleted}
        />

        <ChatInput
          onSendMessage={messageHandlers.sendMessage}
          disabled={!updatedComponentState.canSendMessage}
        />
      </KeyboardAvoidingView>

      <TradeRequestModal
        isVisible={isTradeRequestModalVisible}
        onClose={() => setIsTradeRequestModalVisible(false)}
        onTradeRequest={handleTradeRequest}
        isLoading={isTradeRequestLoading}
      />

      <ReviewsModal
        isVisible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        onSubmit={handleReviewSubmit}
        light={reviewLight}
        setLight={setReviewLight}
        contents={reviewContents}
        onContentsChange={setReviewContents}
        onAnimationComplete={() => {
          setReviewLight(60);
          setReviewContents('');
        }}
      />
    </SafeAreaView>
  );
}
