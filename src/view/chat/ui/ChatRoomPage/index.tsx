import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '~/shared/lib/logger';
import Toast from 'react-native-toast-message';
import { useChatRoomController } from '~/widget/chat/model/useChatRoomController';
import { useChatAction } from '~/widget/chat/model/useChatActions';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { useChatUIState } from '~/widget/chat/model/useChatUIState';
import { useMessageActions } from '~/widget/chat/model/useMessageActions';
import { AlertModal } from '@/shared/ui/AlertModal';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { ChatRoomHeader } from '@/widget/chat/ui/ChatRoomHeader';
import { ChatRoomProductInfo } from '@/widget/chat/ui/ChatRoomProductInfo';
import { ChatRoomContent } from '@/widget/chat/ui/ChatRoomContent';
import { TradeRequestModal } from '@/widget/chat/ui/TradeRequestModal';
import { ReservationConfirmModal } from '@/widget/chat/ui/ReservationConfirmModal';
import { Header } from '@/shared/ui/Header';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { ChatInput, MyMessage } from '@/widget/chat';
import { ChatConnectionBanner } from '@/widget/chat/ui/ChatConnectionBanner';
import { MessageActionOverlay } from '@/widget/chat/ui/MessageActionOverlay';
import type { RoomId } from '@/shared/types/chatType';
import { useTradeRequest } from '~/widget/post/model/useTradeRequest';
import { useGetMyInformation } from '~/shared/model/useGetMyInformation';
import { getMyReceivedReview, getTossReview } from '~/entity/reviews/api/getReviews';
import type { ChatApiError } from '~/entity/chat';
import { formatDateDividerLabel, formatMessageTime } from '~/entity/chat/lib/messageRenderer';
import { useGetBlockList } from '~/entity/profile/model/useGetBlockList';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';
import { isValidId } from '~/shared/lib/validateId';
import { chatRoomDataKeys } from '~/entity/chat/model/chatQueryKeys';
import { reviewKeys } from '~/entity/reviews/model/reviewQueryKeys';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isValidRoomId = isValidId(id);
  const roomId = (isValidRoomId ? Number(id) : NaN) as RoomId;
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
    refetch: refetchMessages,
    connectionState,
    isBlockedByOtherUser,
    messageHandlers,
    scrollToEnd,
    markRoomAsRead,
    olderMessages,
  } = useChatRoomController({ roomId });

  const messageActions = useMessageActions(roomId);

  const { navigationHandlers, formatLastMessageDate } = useChatAction({
    otherUserInfo,
  });

  // 소켓이 연결된 동안에는 새 메시지와 거래 상태가 실시간으로 들어오므로 폴링하지 않는다.
  // 같은 쿼리를 구독하는 다른 곳은 폴링을 지정하지 않으므로 이 화면의 설정만 적용된다
  const { data: roomData, error: roomDataError } = useChatRoomData({
    roomId,
    polling: connectionState !== 'connected',
  });
  const { data: myInfo } = useGetMyInformation();
  const { data: blockList } = useGetBlockList();
  const isBlocked = !!blockList?.some((b) => b.memberId === otherUserInfo.id);
  const { unblock } = useBlockUser(otherUserInfo.id);
  // isBlocked는 내가 차단한 목록 기준이라, 상대방이 나를 차단한 경우는 잡아내지 못한다.
  // 그 경우는 메시지 전송이 서버에서 거부될 때 소켓 error 이벤트로만 알 수 있다.
  const isChatBlocked = isBlocked || isBlockedByOtherUser;
  const visibleMessages = useMemo(
    () => (isBlocked ? messages.filter((m) => m.isMine) : messages),
    [messages, isBlocked]
  );
  const isTradeCompleted = Boolean(roomData?.product?.isCompleted);
  // 예약 생성/취소·거래완료 컨트롤은 Mode 기준 판매자(isSeller)가 아니라 게시글 작성자만
  // 볼 수 있어야 한다(School-of-Company/Gwangsan-Server#357, #397). 서버가 isAuthor를
  // 내려주기 전까지는 기존 동작(isSeller)을 그대로 fallback으로 사용한다.
  const canManageReservation = Boolean(roomData?.product?.isAuthor ?? roomData?.product?.isSeller);
  const isReserved = Boolean(roomData?.product?.isReserved);
  const productId = roomData?.product?.id;

  // 이 거래(물품)로 받은 후기 상세로 보내기 위해, 받은 후기 목록에서 productId가 일치하는 항목을 찾는다
  const { data: myReceivedReviews } = useQuery({
    queryKey: reviewKeys.received('current'),
    queryFn: () => getMyReceivedReview(),
    enabled: isTradeCompleted && !!myInfo,
  });
  const tradeReview = myReceivedReviews?.find((review) => review.productId === productId);

  // 리뷰 버튼을 "작성하러 가기" ↔ "확인하기"로 나누기 위해, 내가 쓴 후기 목록에서 productId가 일치하는 항목을 찾는다
  const { data: myWrittenReviews } = useQuery({
    queryKey: reviewKeys.toss(),
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
    isCompletingTrade,
  } = useTradeHandlers({
    roomId,
    roomData: roomData || null,
    otherUserInfo,
  });

  // 키보드가 내려가는 레이아웃 변동과 바텀시트 등장 애니메이션이 겹치면 배경 딤이 씹히므로,
  // 키보드가 떠 있으면 완전히 내려간 뒤(keyboardDidHide) 시트를 연다
  const isKeyboardVisibleRef = useRef(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      isKeyboardVisibleRef.current = true;
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardVisibleRef.current = false;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const openAfterKeyboardDismiss = useCallback((openFn: () => void) => {
    if (!isKeyboardVisibleRef.current) {
      openFn();
      return;
    }
    Keyboard.dismiss();
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      hideSub.remove();
      openFn();
    });
  }, []);

  const handleOpenReservationConfirm = useCallback(() => {
    openAfterKeyboardDismiss(() => setIsReservationConfirmVisible(true));
  }, [openAfterKeyboardDismiss]);

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
      myNickname: myInfo?.nickname,
      hasTradeRequest,
      shouldShowButtons,
      onOpenReservationModal: handleOpenReservationConfirm,
      onOpenMap: handleOpenMap,
    });

  const updatedComponentState = useMemo(
    () => ({
      ...componentState,
      hasMessages: visibleMessages.length > 0,
      // 소켓이 끊겨도 입력은 허용한다. 보낸 메시지는 대기열에 들어갔다가 재연결되면 전송된다
      canSendMessage: !isChatBlocked,
    }),
    [componentState, visibleMessages.length, isChatBlocked]
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

  const { handleTradeRequest: executeTradeRequest, isLoading: isTradeRequestLoading } =
    useTradeRequest({
      productId: tradeRequestInfo.productId,
      sellerId: tradeRequestInfo.sellerId,
    });

  const handleMenuPress = useCallback(() => {
    openAfterKeyboardDismiss(() => setIsTradeRequestModalVisible(true));
  }, [openAfterKeyboardDismiss]);

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
      queryClient.invalidateQueries({ queryKey: chatRoomDataKeys.room(roomId) });
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
      lastMessageDate={formatLastMessageDate(visibleMessages)}
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
    canManageReservation ? (
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          testID="trade-seller-button"
          onPress={isReserved ? handleCancelReservation : handleOpenReservationConfirm}
          className={`shrink-0 rounded-lg px-5 py-2.5 ${isReserved ? 'bg-background' : 'bg-main-500'}`}>
          <Text className={`text-label font-medium ${isReserved ? 'text-gray-700' : 'text-white'}`}>
            {isReserved ? '예약 취소' : '예약하기'}
          </Text>
        </TouchableOpacity>
        {isReserved && (
          <TouchableOpacity
            testID="trade-complete-button"
            onPress={handleTradeAccept}
            disabled={isCompletingTrade}
            className={`shrink-0 rounded-lg px-5 py-2.5 ${
              isCompletingTrade ? 'bg-disabled' : 'bg-main-500'
            }`}>
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
          hasTradeRequest && !canWithdrawTradeRequest ? 'bg-disabled' : 'bg-main-500'
        }`}>
        <Text
          className={`text-label font-medium ${
            hasTradeRequest && !canWithdrawTradeRequest ? 'text-gray-500' : 'text-white'
          }`}>
          거래요청
        </Text>
      </TouchableOpacity>
    );

  if (!isValidRoomId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">잘못된 채팅방입니다.</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header headerTitle="채팅" />
        <ErrorFallback title="채팅방을 불러오지 못했습니다." onRetry={() => refetchMessages()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle={updatedComponentState.headerTitle} connectionState={connectionState} />
      <ChatConnectionBanner connectionState={connectionState} />

      {(productInfoConfig.shouldShow || isTradeCompleted) && (
        <View className="bg-surface-muted">
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
        messages={visibleMessages}
        hasMessages={updatedComponentState.hasMessages}
        flatListRef={flatListRef}
        renderHeader={renderHeader}
        onProfilePress={navigationHandlers.goToProfile}
        onScrollToEnd={() => scrollToEnd(true)}
        tradeEmbedConfig={tradeEmbedConfig}
        onReviewButtonPress={handleReviewButtonPress}
        showReviewButton={isTradeCompleted}
        hasReviewedTrade={Boolean(myTradeReview)}
        onMyMessageLongPress={messageActions.openMessageMenu}
        olderMessages={olderMessages}
      />

      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        {isBlocked ? (
          <View className="flex-row items-center justify-between border-t border-gray-200 bg-background px-4 py-4">
            <Text className="text-label text-gray-500">차단한 사용자입니다.</Text>
            <TouchableOpacity
              testID="chat-unblock-button"
              onPress={() => unblock.mutate()}
              disabled={unblock.isPending}
              className={`rounded-lg bg-surface-muted px-4 py-2 ${unblock.isPending ? 'opacity-50' : ''}`}>
              <Text className="text-label font-medium text-gray-900">
                {unblock.isPending ? '해제 중...' : '차단 풀기'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isBlockedByOtherUser ? (
          <View
            testID="chat-blocked-by-other-banner"
            className="border-t border-gray-200 bg-background px-4 py-4">
            <Text className="text-label text-gray-500">
              상대방이 차단하여 메시지를 보낼 수 없습니다.
            </Text>
          </View>
        ) : (
          <ChatInput
            onSendMessage={messageHandlers.sendMessage}
            disabled={!updatedComponentState.canSendMessage}
            onFocus={() => scrollToEnd(true)}
            editingMessage={messageActions.editingMessage}
            onSubmitEdit={messageActions.submitEdit}
            onCancelEdit={messageActions.cancelEdit}
          />
        )}
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

      <MessageActionOverlay
        visible={messageActions.menu !== null}
        anchor={messageActions.menu?.anchor ?? null}
        canEdit={messageActions.menu?.canEdit ?? false}
        timeLabel={
          messageActions.menu
            ? `${formatDateDividerLabel(messageActions.menu.message.createdAt)} ${formatMessageTime(messageActions.menu.message.createdAt)}`
            : undefined
        }
        onEdit={messageActions.selectEdit}
        onDelete={messageActions.selectDelete}
        onClose={messageActions.closeMenu}>
        {messageActions.menu && (
          <MyMessage message={messageActions.menu.message} showTime={false} />
        )}
      </MessageActionOverlay>

      <AlertModal
        isVisible={messageActions.isDeleteConfirmVisible}
        message={'메시지를 삭제할까요?\n상대방 화면에서도 삭제됩니다.'}
        confirmText="삭제"
        destructive
        onCancel={messageActions.cancelDelete}
        onConfirm={messageActions.confirmDelete}
      />
    </SafeAreaView>
  );
}
