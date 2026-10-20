import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { withdrawTrade } from '~/entity/post/api/withdrawTrade';
import { makeReservation } from '~/entity/post/api/makeReservation';
import { cancelReservation } from '~/entity/post/api/cancelReservation';
import { getChatRoomData } from '~/entity/chat/api/getChatMessages';
import type { RoomId } from '~/shared/types/chatType';
import { logger } from '~/shared/lib/logger';
import { chatRoomDataKeys } from '~/entity/chat/model/chatQueryKeys';

interface UseTradeHandlersParams {
  readonly roomId: RoomId;
  readonly roomData: {
    readonly product?: {
      readonly id: number;
      readonly createdAt: string | null;
      readonly isCompletable: boolean;
    } | null;
  } | null;
  readonly otherUserInfo: { nickname: string; id?: number };
}

export interface ReservationInput {
  readonly scheduledAt: string;
  readonly placeName: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
}

interface UseTradeHandlersReturn {
  readonly handleTradeAccept: () => Promise<void>;
  readonly handleReservation: (input: ReservationInput) => Promise<void>;
  readonly handleCancelReservation: () => Promise<void>;
  readonly handleTradeRequestButtonPress: () => Promise<boolean>;
  readonly hasTradeRequest: boolean;
  readonly shouldShowButtons: boolean;
  readonly canWithdrawTradeRequest: boolean;
  readonly isCompletingTrade: boolean;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const useTradeHandlers = ({
  roomId,
  roomData,
  otherUserInfo,
}: UseTradeHandlersParams): UseTradeHandlersReturn => {
  const queryClient = useQueryClient();

  const patchProduct = useCallback(
    (patch: Record<string, unknown>) => {
      queryClient.setQueryData<{ product: Record<string, unknown> | null }>(
        chatRoomDataKeys.room(roomId),
        (old) => (old?.product ? { ...old, product: { ...old.product, ...patch } } : old)
      );
    },
    [queryClient, roomId]
  );

  const hasTradeRequest =
    roomData?.product?.createdAt !== null && roomData?.product?.createdAt !== undefined;

  const shouldShowButtons = hasTradeRequest && roomData?.product?.isCompletable;

  // isCompletable=false인 채로 PENDING 요청이 있다는 건, 내가 보낸 요청을 상대가 아직
  // 확정하지 않았다는 뜻이다(isCompletable=true면 반대로 상대가 보낸 요청을 내가 수락할 차례).
  const canWithdrawTradeRequest = hasTradeRequest && roomData?.product?.isCompletable === false;

  // 연타하면 첫 요청이 완료된 뒤 두 번째 요청이 "이미 완료된 거래"로 실패해 에러 토스트가 뜬다.
  // state는 렌더 전까지 반영되지 않아 같은 프레임의 연속 탭을 못 막으므로 ref로 잠근다.
  const isCompletingTradeRef = useRef(false);
  const [isCompletingTrade, setIsCompletingTrade] = useState(false);

  // POST /post/trade는 상황에 따라 거래를 완료하기도, 상대 확인을 기다리는 요청만 만들기도 한다.
  // 응답에는 그 구분이 없어 채팅방 데이터를 다시 받아 실제 완료 여부를 확인한다. 조회에 실패하면
  // 완료됐다고 단정하지 않는다 — 실제 상태는 소켓 이벤트나 폴링으로 곧 반영된다.
  const fetchIsTradeCompleted = useCallback(async () => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: chatRoomDataKeys.room(roomId),
        queryFn: () => getChatRoomData(roomId),
        staleTime: 0,
      });
      return Boolean(data.product?.isCompleted);
    } catch {
      return false;
    }
  }, [queryClient, roomId]);

  const handleTradeAccept = useCallback(async () => {
    if (isCompletingTradeRef.current) return;

    if (!roomData?.product?.id || !otherUserInfo.id) {
      logger.error('handleTradeAccept invalid params', {
        productId: roomData?.product?.id,
        otherMemberId: otherUserInfo.id,
      });
      Toast.show({
        type: 'error',
        text1: '거래 완료 실패',
        text2: '상대방 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      });
      return;
    }

    // 상대가 보낸 대기 요청을 확정하는 경우에만 서버가 반드시 거래를 완료한다
    const isConfirmingOtherRequest = hasTradeRequest && roomData.product.isCompletable;

    isCompletingTradeRef.current = true;
    setIsCompletingTrade(true);

    try {
      await requestTrade({
        productId: roomData.product.id,
        otherMemberId: otherUserInfo.id,
      });

      const isCompleted = isConfirmingOtherRequest || (await fetchIsTradeCompleted());

      if (isCompleted) {
        patchProduct({ isCompleted: true, isCompletable: false });
        // 거래가 확정되면 서버에서 광산이 차감/적립된다. 내 프로필은 5분간 캐시되므로 바로 다시
        // 받아오지 않으면 잔액이 이전 값(예: 0)으로 남아 있었다(#785). 홈 화면 광산 배너는 별도
        // 쿼리(myInformation)를 써서 함께 무효화해야 한다.
        queryClient.invalidateQueries({ queryKey: ['myProfile', 'current'] });
        queryClient.invalidateQueries({ queryKey: ['myInformation'] });

        Toast.show({
          type: 'success',
          text1: '거래가 완료되었습니다!',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: '거래완료 요청을 보냈어요',
          text2: `${otherUserInfo.nickname}님이 확인하면 거래가 완료돼요.`,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 완료 실패',
        text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      isCompletingTradeRef.current = false;
      setIsCompletingTrade(false);
    }
  }, [
    roomData,
    otherUserInfo.id,
    otherUserInfo.nickname,
    hasTradeRequest,
    fetchIsTradeCompleted,
    patchProduct,
    queryClient,
  ]);

  // 대기중인 내 요청을 다시 누르면 "취소" 개념을 노출하지 않고, 하루가 지났을 때만
  // 내부적으로 기존 요청을 철회한 뒤 새 요청을 보낼 수 있도록 통과시킨다(호출부가 true를
  // 받으면 거래 요청 모달을 연다). 하루가 안 지났으면 안내 토스트만 띄우고 막는다.
  const handleTradeRequestButtonPress = useCallback(async (): Promise<boolean> => {
    if (!canWithdrawTradeRequest) return true;

    const createdAt = roomData?.product?.createdAt;
    const sentAt = createdAt ? new Date(createdAt).getTime() : null;

    if (sentAt !== null && Date.now() - sentAt < ONE_DAY_MS) {
      Toast.show({
        type: 'info',
        text1: '내일 다시 보낼 수 있어요',
      });
      return false;
    }

    if (!roomData?.product?.id || !otherUserInfo.id) {
      logger.error('handleTradeRequestButtonPress invalid params', {
        productId: roomData?.product?.id,
        otherMemberId: otherUserInfo.id,
      });
      Toast.show({
        type: 'error',
        text1: '거래 요청 실패',
        text2: '상대방 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      });
      return false;
    }

    try {
      await withdrawTrade({
        productId: roomData.product.id,
        otherMemberId: otherUserInfo.id,
      });

      patchProduct({ createdAt: null, isCompletable: true });

      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 요청 실패',
        text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });

      return false;
    }
  }, [canWithdrawTradeRequest, roomData, otherUserInfo.id, patchProduct]);

  const handleReservation = useCallback(
    async ({ scheduledAt, placeName, address, latitude, longitude }: ReservationInput) => {
      if (!roomData?.product?.id) return;

      try {
        await makeReservation({
          productId: roomData.product.id,
          roomId: Number(roomId),
          scheduledAt,
          placeName,
          address,
          latitude,
          longitude,
        });

        patchProduct({
          isReserved: true,
          reservationScheduledAt: scheduledAt,
          reservationPlaceName: placeName,
          reservationAddress: address,
          reservationLatitude: latitude,
          reservationLongitude: longitude,
        });

        Toast.show({
          type: 'success',
          text1: '예약이 완료되었습니다!',
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: '예약 실패',
          text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        });
        throw error;
      }
    },
    [roomData, roomId, patchProduct]
  );

  const handleCancelReservation = useCallback(async () => {
    if (!roomData?.product?.id) return;

    try {
      await cancelReservation({ productId: roomData.product.id });

      patchProduct({
        isReserved: false,
        reservedAt: null,
        reservationScheduledAt: null,
        reservationPlaceName: null,
        reservationAddress: null,
        reservationLatitude: null,
        reservationLongitude: null,
      });

      Toast.show({
        type: 'success',
        text1: '예약이 취소되었습니다!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '예약 취소 실패',
        text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    }
  }, [roomData, patchProduct]);

  return {
    handleTradeAccept,
    handleReservation,
    handleCancelReservation,
    handleTradeRequestButtonPress,
    hasTradeRequest,
    shouldShowButtons,
    canWithdrawTradeRequest,
    isCompletingTrade,
  };
};
