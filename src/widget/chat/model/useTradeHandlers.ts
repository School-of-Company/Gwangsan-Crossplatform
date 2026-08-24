import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { requestTrade } from '~/entity/post/api/requestTrade';
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
  readonly sendMessage?: (content: string | null, imageIds: number[]) => void;
}

interface UseTradeHandlersReturn {
  readonly handleTradeAccept: () => Promise<void>;
  readonly handleReservation: () => Promise<void>;
  readonly handleCancelReservation: () => Promise<void>;
  readonly hasTradeRequest: boolean;
  readonly shouldShowButtons: boolean;
}

export const useTradeHandlers = ({
  roomId,
  roomData,
  otherUserInfo,
  sendMessage,
}: UseTradeHandlersParams): UseTradeHandlersReturn => {
  const queryClient = useQueryClient();

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

      queryClient.setQueryData<{ product: Record<string, unknown> | null }>(
        ['chatRoomData', roomId],
        (old) => {
          if (!old?.product) return old;
          return {
            ...old,
            product: { ...old.product, isCompleted: true, isCompletable: false },
          };
        }
      );

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
  }, [roomData, otherUserInfo.id, queryClient, roomId]);

  const handleReservation = useCallback(async () => {
    if (!roomData?.product?.id) return;

    try {
      await makeReservation({ productId: roomData.product.id });

      // ponytail: 예약 사실을 채팅 메시지로도 알림. 채팅 서버가 transactionStateChanged에
      // isReserved를 실어주기 시작하면(현재 DTO에서 whitelist로 잘림) 이 줄은 제거.
      sendMessage?.('예약했습니다.', []);

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
    }
  }, [roomData, sendMessage]);

  const handleCancelReservation = useCallback(async () => {
    if (!roomData?.product?.id) return;

    try {
      await cancelReservation({ productId: roomData.product.id });

      sendMessage?.('예약을 취소했습니다.', []);

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
  }, [roomData, sendMessage]);

  return {
    handleTradeAccept,
    handleReservation,
    handleCancelReservation,
    hasTradeRequest,
    shouldShowButtons,
  };
};
