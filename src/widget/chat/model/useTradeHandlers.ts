import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { makeReservation } from '~/entity/post/api/makeReservation';
import { cancelReservation } from '~/entity/post/api/cancelReservation';
import { getCurrentLocation } from '~/shared/lib/getCurrentLocation';
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
}

interface UseTradeHandlersReturn {
  readonly handleTradeAccept: () => Promise<void>;
  readonly handleReservation: (input: ReservationInput) => Promise<void>;
  readonly handleCancelReservation: () => Promise<void>;
  readonly hasTradeRequest: boolean;
  readonly shouldShowButtons: boolean;
}

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

  const handleReservation = useCallback(
    async ({ scheduledAt, placeName, address }: ReservationInput) => {
      if (!roomData?.product?.id) return;

      try {
        const { latitude, longitude } = await getCurrentLocation();

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
    hasTradeRequest,
    shouldShowButtons,
  };
};
