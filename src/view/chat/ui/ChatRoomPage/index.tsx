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
import { ReservationModal } from '@/widget/chat/ui/ReservationModal';
import { ReservationConfirmModal } from '@/widget/chat/ui/ReservationConfirmModal';
import { Header } from '@/shared/ui/Header';
import { ChatInput } from '@/widget/chat';
import type { RoomId } from '@/shared/types/chatType';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';
import { createReview } from '~/entity/post/api/createReview';
import ReviewsModal from '~/entity/post/ui/ReviewsModal';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import type { ReservationConfirmPayload } from '@/widget/chat/ui/ReservationModal';
import { getMyReceivedReview } from '~/view/reviews/api/getReviews';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isTradeRequestModalVisible, setIsTradeRequestModalVisible] = useState(false);
  const [isReservationConfirmVisible, setIsReservationConfirmVisible] = useState(false);
  const [isReservationModalVisible, setIsReservationModalVisible] = useState(false);
  const [isReservationLoading, setIsReservationLoading] = useState(false);
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

  const { navigationHandlers, formatLastMessageDate } = useChatAction({
    otherUserInfo,
  });

  const { data: roomData } = useChatRoomData({ roomId });
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
    handleReservation,
    handleCancelReservation,
    hasTradeRequest,
    shouldShowButtons,
  } = useTradeHandlers({
    roomId,
    roomData: roomData || null,
    otherUserInfo,
  });

  const handleOpenReservationModal = useCallback(() => {
    setIsReservationModalVisible(true);
  }, []);

  const handleOpenReservationConfirm = useCallback(() => {
    setIsReservationConfirmVisible(true);
  }, []);

  const handleReservationConfirmProceed = useCallback(() => {
    setIsReservationConfirmVisible(false);
    setIsReservationModalVisible(true);
  }, []);

  const handleReservationConfirm = useCallback(
    async (payload: ReservationConfirmPayload) => {
      try {
        setIsReservationLoading(true);
        await handleReservation(payload);
        setIsReservationModalVisible(false);
      } catch (error) {
        logger.error('handleReservationConfirm failed', error);
      } finally {
        setIsReservationLoading(false);
      }
    },
    [handleReservation]
  );

  const { tradeEmbedConfig, menuConfig, tradeRequestInfo, componentState, productInfoConfig } =
    useChatUIState({
      roomId,
      otherUserInfo,
      hasTradeRequest,
      shouldShowButtons,
      handleTradeAccept,
      handleCancelReservation,
      onOpenReservationModal: handleOpenReservationModal,
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

  const handleTradeRequest = useCallback(async () => {
    try {
      await executeTradeRequest();
      setIsTradeRequestModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['chatRoomData', roomId] });
      Toast.show({
        type: 'success',
        text1: '게시물 작성자에게 거래를 요청했어요!',
        text2: '예약을 잡을까요?',
      });
    } catch (error) {
      logger.error('handleTradeRequest failed', error);
    }
  }, [executeTradeRequest, queryClient, roomId]);

  const handleReviewSubmit = useCallback(
    async (light: number, contents: string) => {
      if (!roomData?.product?.id || !otherUserInfo.id) return;

      try {
        await createReview({
          productId: roomData.product.id,
          otherMemberId: otherUserInfo.id,
          content: contents,
          light: light,
        });
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        Toast.show({
          type: 'success',
          text1: '리뷰가 성공적으로 작성되었습니다.',
        });
        setIsReviewModalVisible(false);
        setReviewLight(60);
        setReviewContents('');
      } catch (error) {
        logger.error('리뷰 작성 실패', error);
        Toast.show({
          type: 'error',
          text1: '리뷰 작성 실패',
          text2: '잠시 후 다시 시도해주세요.',
        });
      }
    },
    [roomData, otherUserInfo.id, queryClient]
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
      <TouchableOpacity
        testID="trade-seller-button"
        onPress={isReserved ? handleTradeAccept : handleOpenReservationConfirm}
        className="shrink-0 rounded-lg bg-main-500 px-5 py-2.5">
        <Text className="text-label font-medium text-white">
          {isReserved ? '거래완료' : '예약하기'}
        </Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        testID="trade-request-button"
        onPress={handleMenuPress}
        disabled={hasTradeRequest}
        className={`shrink-0 rounded-lg px-5 py-2.5 ${
          hasTradeRequest ? 'bg-[#CDCDCF]' : 'bg-main-500'
        }`}>
        <Text
          className={`text-label font-medium ${hasTradeRequest ? 'text-gray-500' : 'text-white'}`}>
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

      <ReservationModal
        isVisible={isReservationModalVisible}
        onClose={() => setIsReservationModalVisible(false)}
        onConfirm={handleReservationConfirm}
        isLoading={isReservationLoading}
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
