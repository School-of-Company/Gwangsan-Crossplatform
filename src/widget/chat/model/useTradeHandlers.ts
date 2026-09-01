import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { withdrawTrade } from '~/entity/post/api/withdrawTrade';
import { makeReservation } from '~/entity/post/api/makeReservation';
import { cancelReservation } from '~/entity/post/api/cancelReservation';
import type { RoomId } from '~/shared/types/chatType';

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
        ['chatRoomData', roomId],
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

  const handleTradeAccept = useCallback(async () => {
    if (!roomData?.product?.id || !otherUserInfo.id) return;

    try {
      await requestTrade({
        productId: roomData.product.id,
        otherMemberId: otherUserInfo.id,
      });

      patchProduct({ isCompleted: true, isCompletable: false });

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
  }, [roomData, otherUserInfo.id, patchProduct]);

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

    if (!roomData?.product?.id || !otherUserInfo.id) return false;

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
  };
};
