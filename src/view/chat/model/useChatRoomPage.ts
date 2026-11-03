import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Keyboard } from 'react-native';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '~/shared/lib/logger';
import Toast from 'react-native-toast-message';
import { useChatRoomController } from '~/widget/chat/model/useChatRoomController';
import { useChatAction } from '~/widget/chat/model/useChatActions';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { useChatUIState } from '~/widget/chat/model/useChatUIState';
import { useMessageActions } from '~/widget/chat/model/useMessageActions';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import type { RoomId } from '~/shared/types/chatType';
import { useTradeRequest } from '~/widget/post/model/useTradeRequest';
import { useGetMyInformation } from '~/entity/profile/model/useGetMyInformation';
import { useGetReviews } from '~/entity/reviews/model/useGetReviews';
import type { ChatApiError } from '~/entity/chat';
import { useGetBlockList } from '~/entity/profile/model/useGetBlockList';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';
import { isValidId } from '~/shared/lib/validateId';
import { chatRoomDataKeys } from '~/entity/chat/model/chatQueryKeys';

// 채팅방 화면의 상태·핸들러(메시지·소켓, 거래·예약, 차단, 후기, 바텀시트 열기)를 한곳에 모은다.
// ChatRoomPage는 이 값으로 그리기만 한다
export const useChatRoomPage = () => {
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
  const { data: myReceivedReviews } = useGetReviews('receive', String(myInfo?.memberId), {
    enabled: isTradeCompleted && !!myInfo,
    myMemberId: myInfo?.memberId,
  });
  const tradeReview = myReceivedReviews?.find((review) => review.productId === productId);

  // 리뷰 버튼을 "작성하러 가기" ↔ "확인하기"로 나누기 위해, 내가 쓴 후기 목록에서 productId가 일치하는 항목을 찾는다
  const { data: myWrittenReviews } = useGetReviews('toss', undefined, {
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

  return {
    isValidRoomId,
    insets,
    isTradeRequestModalVisible,
    setIsTradeRequestModalVisible,
    isReservationConfirmVisible,
    setIsReservationConfirmVisible,
    flatListRef,
    otherUserInfo,
    isLoading,
    isError,
    refetchMessages,
    connectionState,
    isBlockedByOtherUser,
    messageHandlers,
    scrollToEnd,
    olderMessages,
    messageActions,
    navigationHandlers,
    formatLastMessageDate,
    myInfo,
    isBlocked,
    unblock,
    visibleMessages,
    isTradeCompleted,
    canManageReservation,
    isReserved,
    productId,
    myTradeReview,
    handleProductPress,
    handleReviewLinkPress,
    handleTradeAccept,
    handleCancelReservation,
    hasTradeRequest,
    canWithdrawTradeRequest,
    isCompletingTrade,
    handleOpenReservationConfirm,
    handleReservationConfirmProceed,
    tradeEmbedConfig,
    menuConfig,
    productInfoConfig,
    updatedComponentState,
    isTradeRequestLoading,
    handleTradeRequestButtonPressed,
    handleTradeRequest,
    handleReviewButtonPress,
  };
};
