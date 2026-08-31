import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { requestTrade } from '../api/requestTrade';
import { useChatEntry } from '~/shared/lib/useChatEntry';
import { logger } from '~/shared/lib/logger';

interface UseTradeRequestOptions {
  readonly productId: number;
  readonly sellerId: number;
}

interface UseTradeRequestReturn {
  readonly handleTradeRequest: () => Promise<void>;
  readonly isLoading: boolean;
  readonly hasSentToday: boolean;
}

// 백엔드에 거래 요청 취소/철회 API가 없어(School-of-Company/Gwangsan-Server#366),
// 한 번 보낸 요청은 상대가 확정하기 전까지 영구히 재요청이 막힌다.
// 임시 조치로 게시글별 하루 1회로 클라이언트에서 재전송을 제한한다.
const getTradeRequestStorageKey = (productId: number) => `tradeRequestLastSentAt:${productId}`;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getLastSentAt = async (productId: number): Promise<Date | null> => {
  try {
    const raw = await AsyncStorage.getItem(getTradeRequestStorageKey(productId));
    return raw ? new Date(raw) : null;
  } catch {
    return null;
  }
};

const saveLastSentAt = async (productId: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(getTradeRequestStorageKey(productId), new Date().toISOString());
  } catch {
    // 저장 실패해도 거래 신청 자체는 이미 서버에 접수된 상태라 무시한다
  }
};

export const useTradeRequest = ({
  productId,
  sellerId,
}: UseTradeRequestOptions): UseTradeRequestReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSentToday, setHasSentToday] = useState(false);
  const { navigateToChat, navigateToRoom } = useChatEntry();

  useEffect(() => {
    let isMounted = true;

    getLastSentAt(productId).then((lastSentAt) => {
      if (isMounted) {
        setHasSentToday(!!lastSentAt && isSameDay(lastSentAt, new Date()));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleTradeRequest = useCallback(async () => {
    if (isLoading) return;

    if (hasSentToday) {
      Toast.show({
        type: 'info',
        text1: '오늘은 이미 거래 신청을 보냈어요',
        text2: '내일 다시 시도해주세요.',
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await requestTrade({
        productId,
        otherMemberId: sellerId,
      });

      await saveLastSentAt(productId);
      setHasSentToday(true);

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
  }, [productId, sellerId, isLoading, hasSentToday, navigateToChat, navigateToRoom]);

  return {
    handleTradeRequest,
    isLoading,
    hasSentToday,
  };
};
