import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '~/shared/lib/logger';
import Toast from 'react-native-toast-message';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useChatAction } from '~/widget/chat/model/useChatActions';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { useChatUIState } from '~/widget/chat/model/useChatUIState';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { ChatRoomHeader } from '@/widget/chat/ui/ChatRoomHeader';
import { ChatRoomProductInfo } from '@/widget/chat/ui/ChatRoomProductInfo';
import { ChatRoomContent } from '@/widget/chat/ui/ChatRoomContent';
import { TradeRequestModal } from '@/widget/chat/ui/TradeRequestModal';
import { ReservationConfirmModal } from '@/widget/chat/ui/ReservationConfirmModal';
import { Header } from '@/shared/ui/Header';
import { ChatInput } from '@/widget/chat';
import type { RoomId } from '@/shared/types/chatType';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import { getMyReceivedReview, getTossReview } from '~/view/reviews/api/getReviews';
import type { ChatApiError } from '~/entity/chat';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isTradeRequestModalVisible, setIsTradeRequestModalVisible] = useState(false);
  const [isReservationConfirmVisible, setIsReservationConfirmVisible] = useState(false);

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

  const { navigationHandlers, formatLastMessageDate } = useChatAction({
    otherUserInfo,
  });

  const { data: roomData, error: roomDataError } = useChatRoomData({ roomId });
  const { data: myInfo } = useGetMyInformation();
  const isTradeCompleted = Boolean(roomData?.product?.isCompleted);
  const isSeller = Boolean(roomData?.product?.isSeller);
  const isReserved = Boolean(roomData?.product?.isReserved);
  const productId = roomData?.product?.id;

  // 이 거래(물품)로 받은 후기 상세로 보내기 위해, 받은 후기 목록에서 productId가 일치하는 항목을 찾는다
  const { data: myReceivedReviews } = useQuery({
    queryKey: ['reviews', 'receive', 'current'],
    queryFn: getMyReceivedReview,
    enabled: isTradeCompleted && !!myInfo,
  });
  const tradeReview = myReceivedReviews?.find((review) => review.productId === productId);

  // 리뷰 버튼을 "작성하러 가기" ↔ "확인하기"로 나누기 위해, 내가 쓴 후기 목록에서 productId가 일치하는 항목을 찾는다
  const { data: myWrittenReviews } = useQuery({
    queryKey: ['reviews', 'toss'],
    queryFn: getTossReview,
    enabled: isTradeCompleted && !!myInfo,
  });
  const myTradeReview = myWrittenReviews?.find((review) => review.productId === productId);

  const handleProductPress = useCallback(() => {
    if (!productId) return;
    router.push(`/post/${productId}`);
  }, [router, productId]);

  const handleReviewLinkPress = useCallback(() => {
    if (tradeReview) {
      router.push(`/cancelTrade/${tradeReview.reviewId}`);
      return;
    }
    if (myInfo?.memberId != null) {
      router.push(`/reviews/${myInfo.memberId}`);
    }
  }, [router, tradeReview, myInfo]);

  const {
    handleTradeAccept,
    handleCancelReservation,
    handleTradeRequestButtonPress,
    hasTradeRequest,
    shouldShowButtons,
    canWithdrawTradeRequest,
  } = useTradeHandlers({
    roomId,
    roomData: roomData || null,
    otherUserInfo,
  });

  const handleOpenReservationConfirm = useCallback(() => {
    setIsReservationConfirmVisible(true);
  }, []);

  const handleReservationConfirmProceed = useCallback(() => {
    setIsReservationConfirmVisible(false);
    router.push(`/chatting/${roomId}/reservation`);
  }, [router, roomId]);

  const handleOpenMap = useCallback(() => {
    const product = roomData?.product;
    if (product?.reservationLatitude == null || product?.reservationLongitude == null) return;
    router.push(
      `/chatting/${roomId}/reservation/location?latitude=${product.reservationLatitude}&longitude=${product.reservationLongitude}&placeName=${encodeURIComponent(product.reservationPlaceName ?? '')}`
    );
  }, [router, roomId, roomData?.product]);

  const { tradeEmbedConfig, menuConfig, tradeRequestInfo, componentState, productInfoConfig } =
    useChatUIState({
      roomId,
      otherUserInfo,
      hasTradeRequest,
      shouldShowButtons,
      onOpenReservationModal: handleOpenReservationConfirm,
      onOpenMap: handleOpenMap,
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
      markRoomAsRead(roomId).catch((e) => logger.error('markRoomAsRead failed', e));
    }
  }, [roomId, markRoomAsRead]);

  useEffect(() => {
    // 나가기(삭제)된 채팅방에 알림/딥링크/캐시된 목록으로 재진입하면 서버가 404를 준다.
    // 빈 화면에 머무르며 계속 재요청하는 대신 목록으로 돌려보낸다.
    if ((roomDataError as ChatApiError | null)?.status === 404) {
      Toast.show({
        type: 'info',
        text1: '더 이상 존재하지 않는 채팅방입니다.',
        visibilityTime: 2000,
      });
      router.replace('/chatting');
    }
  }, [roomDataError, router]);

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
    Keyboard.dismiss();
    setIsTradeRequestModalVisible(true);
  }, []);

  const handleTradeRequestButtonPressed = useCallback(async () => {
    const canOpenRequestModal = await handleTradeRequestButtonPress();
    if (canOpenRequestModal) {
      handleMenuPress();
    }
  }, [handleTradeRequestButtonPress, handleMenuPress]);

  const handleTradeRequest = useCallback(async () => {
    try {
      await executeTradeRequest();
      setIsTradeRequestModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['chatRoomData', roomId] });
      Toast.show({
        type: 'success',
        text1: '게시물 작성자에게 거래를 요청했어요!',
      });
    } catch (error) {
      logger.error('handleTradeRequest failed', error);
    }
  }, [executeTradeRequest, queryClient, roomId]);

  const handleReviewButtonPress = useCallback(() => {
    if (myTradeReview) {
      router.push(`/cancelTrade/${myTradeReview.reviewId}`);
      return;
    }
    router.push(`/chatting/${roomId}/review`);
  }, [myTradeReview, router, roomId]);

  const renderHeader = () => (
    <ChatRoomHeader
      otherUserNickname={otherUserInfo.nickname}
      otherUserId={otherUserInfo.id}
      lastMessageDate={formatLastMessageDate(messages)}
      onProfilePress={navigationHandlers.goToOtherUserProfile}
    />
  );

  const renderTradeCompletedInfo = () => (
    <View testID="trade-completed-banner" className="items-end gap-0.5">
      <Text className="shrink-0 text-label text-gray-700" numberOfLines={1}>
        거래 완료
      </Text>
      {myInfo?.memberId != null && (
        <TouchableOpacity testID="received-reviews-link" onPress={handleReviewLinkPress}>
          <Text className="shrink-0 text-caption text-main-500" numberOfLines={1}>
            받은 후기 보기
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const shouldShowTopTradeControl = menuConfig.shouldShowMenuButton && !isTradeCompleted;

  const renderTopTradeControl = () =>
    isSeller ? (
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          testID="trade-seller-button"
          onPress={isReserved ? handleCancelReservation : handleOpenReservationConfirm}
          className={`shrink-0 rounded-lg px-5 py-2.5 ${isReserved ? 'bg-white' : 'bg-main-500'}`}>
          <Text className={`text-label font-medium ${isReserved ? 'text-gray-700' : 'text-white'}`}>
            {isReserved ? '예약 취소' : '예약하기'}
          </Text>
        </TouchableOpacity>
        {isReserved && (
          <TouchableOpacity
            testID="trade-complete-button"
            onPress={handleTradeAccept}
            className="shrink-0 rounded-lg bg-main-500 px-5 py-2.5">
            <Text className="text-label font-medium text-white">거래완료</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : isReserved ? null : (
      <TouchableOpacity
        testID="trade-request-button"
        onPress={handleTradeRequestButtonPressed}
        disabled={hasTradeRequest && !canWithdrawTradeRequest}
        className={`shrink-0 rounded-lg px-5 py-2.5 ${
          hasTradeRequest && !canWithdrawTradeRequest ? 'bg-[#CDCDCF]' : 'bg-main-500'
        }`}>
        <Text
          className={`text-label font-medium ${
            hasTradeRequest && !canWithdrawTradeRequest ? 'text-gray-500' : 'text-white'
          }`}>
          거래요청
        </Text>
      </TouchableOpacity>
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle={updatedComponentState.headerTitle} connectionState={connectionState} />

      {(productInfoConfig.shouldShow || isTradeCompleted) && (
        <View className="bg-[#F3F4F5]">
          {productInfoConfig.shouldShow ? (
            <ChatRoomProductInfo
              title={productInfoConfig.title}
              gwangsan={productInfoConfig.gwangsan}
              imageUrl={productInfoConfig.imageUrl}
              trailing={
                isTradeCompleted
                  ? renderTradeCompletedInfo()
                  : shouldShowTopTradeControl
                    ? renderTopTradeControl()
                    : undefined
              }
              onPress={productId ? handleProductPress : undefined}
            />
          ) : (
            isTradeCompleted && <View className="px-4 py-3">{renderTradeCompletedInfo()}</View>
          )}
        </View>
      )}

      <ChatRoomContent
        messages={messages}
        hasMessages={updatedComponentState.hasMessages}
        flatListRef={flatListRef}
        renderHeader={renderHeader}
        onProfilePress={navigationHandlers.goToProfile}
        onScrollToEnd={() => scrollToEnd(true)}
        tradeEmbedConfig={tradeEmbedConfig}
        onReviewButtonPress={handleReviewButtonPress}
        showReviewButton={isTradeCompleted}
        hasReviewedTrade={Boolean(myTradeReview)}
      />

      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        <ChatInput
          onSendMessage={messageHandlers.sendMessage}
          disabled={!updatedComponentState.canSendMessage}
          onFocus={() => scrollToEnd(true)}
        />
      </KeyboardStickyView>

      <TradeRequestModal
        isVisible={isTradeRequestModalVisible}
        onClose={() => setIsTradeRequestModalVisible(false)}
        onTradeRequest={handleTradeRequest}
        isLoading={isTradeRequestLoading}
      />

      <ReservationConfirmModal
        isVisible={isReservationConfirmVisible}
        onClose={() => setIsReservationConfirmVisible(false)}
        onConfirm={handleReservationConfirmProceed}
      />
    </SafeAreaView>
  );
}
