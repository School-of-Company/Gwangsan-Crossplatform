import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { requestTrade } from '../api/requestTrade';
import { withdrawTrade } from '../api/withdrawTrade';
import { useChatEntry } from '~/shared/lib/useChatEntry';
import { logger } from '~/shared/lib/logger';

interface UseTradeRequestOptions {
  readonly productId: number;
  readonly sellerId: number;
}

interface UseTradeRequestReturn {
  readonly handleTradeRequest: () => Promise<void>;
  readonly handleWithdrawTradeRequest: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isWithdrawing: boolean;
  readonly hasPendingRequest: boolean;
}

// GET /post/{post_id}의 isCompletable은 PENDING 거래 완료 요청 여부를 반영하지 않는다
// (School-of-Company/Gwangsan-Server#366). 이 화면은 그 신호를 서버에서 받을 수 없어,
// "내가 방금 보낸 요청이 아직 대기중"이라는 사실만 로컬에 기록해 버튼을 신청/취소로 전환한다.
// 실제 취소는 DELETE /post/trade(School-of-Company/Gwangsan-Server#367)로 처리한다.
const getPendingRequestStorageKey = (productId: number) => `tradeRequestPending:${productId}`;

const getHasPendingRequest = async (productId: number): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(getPendingRequestStorageKey(productId))) === 'true';
  } catch {
    return false;
  }
};

const savePendingRequest = async (productId: number, pending: boolean): Promise<void> => {
  try {
    if (pending) {
      await AsyncStorage.setItem(getPendingRequestStorageKey(productId), 'true');
    } else {
      await AsyncStorage.removeItem(getPendingRequestStorageKey(productId));
    }
  } catch {
    // 저장 실패해도 서버 요청 자체는 이미 처리된 상태라 무시한다
  }
};

export const useTradeRequest = ({
  productId,
  sellerId,
}: UseTradeRequestOptions): UseTradeRequestReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { navigateToChat, navigateToRoom } = useChatEntry();

  useEffect(() => {
    let isMounted = true;

    getHasPendingRequest(productId).then((pending) => {
      if (isMounted) {
        setHasPendingRequest(pending);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleTradeRequest = useCallback(async () => {
    if (isLoading || hasPendingRequest) return;

    try {
      setIsLoading(true);

      const response = await requestTrade({
        productId,
        otherMemberId: sellerId,
      });

      await savePendingRequest(productId, true);
      setHasPendingRequest(true);

      Toast.show({
        type: 'success',
        text1: '거래 신청이 전송되었습니다',
        text2: '채팅방에서 대화를 시작해보세요!',
      });

      try {
        if (response.roomId) {
          await navigateToRoom(response.roomId);
        } else {
          await navigateToChat(productId);
        }
      } catch (navigationError) {
        logger.error('Chat navigation failed', navigationError);
        Toast.show({
          type: 'info',
          text1: '채팅방 이동 중 오류가 발생했습니다',
          text2:
            navigationError instanceof Error
              ? navigationError.message
              : '채팅하기 버튼을 눌러 이동해주세요.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 신청 실패',
        text2: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productId, sellerId, isLoading, hasPendingRequest, navigateToChat, navigateToRoom]);

  const handleWithdrawTradeRequest = useCallback(async () => {
    if (isWithdrawing) return;

    try {
      setIsWithdrawing(true);

      await withdrawTrade({ productId, otherMemberId: sellerId });

      await savePendingRequest(productId, false);
      setHasPendingRequest(false);

      Toast.show({
        type: 'success',
        text1: '거래 신청을 취소했어요',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 신청 취소 실패',
        text2: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
      throw error;
    } finally {
      setIsWithdrawing(false);
    }
  }, [productId, sellerId, isWithdrawing]);

  return {
    handleTradeRequest,
    handleWithdrawTradeRequest,
    isLoading,
    isWithdrawing,
    hasPendingRequest,
  };
};
