import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import { acceptTrade, rejectTrade } from '../api/acceptTrade';
import type { TradeProduct } from '../model/chatTypes';

interface UseTradeActionsOptions {
  readonly product: TradeProduct | null;
  readonly onTradeAccepted?: () => void;
  readonly onTradeRejected?: () => void;
}

interface UseTradeActionsReturn {
  readonly handleAcceptTrade: () => Promise<void>;
  readonly handleRejectTrade: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isAccepted: boolean;
  readonly isRejected: boolean;
}

export const useTradeActions = ({
  product,
  onTradeAccepted,
  onTradeRejected,
}: UseTradeActionsOptions): UseTradeActionsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  const handleAcceptTrade = useCallback(async () => {
    if (!product || isLoading || isAccepted || isRejected) return;

    try {
      setIsLoading(true);
      await acceptTrade({ productId: product.id });
      
      setIsAccepted(true);
      onTradeAccepted?.();

      Toast.show({
        type: 'success',
        text1: '거래가 성사되었습니다!',
        text2: '상품이 예약되었습니다.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 수락 실패',
        text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [product, isLoading, isAccepted, isRejected, onTradeAccepted]);

  const handleRejectTrade = useCallback(async () => {
    if (!product || isLoading || isAccepted || isRejected) return;

    try {
      setIsLoading(true);
      await rejectTrade({ productId: product.id });
      
      setIsRejected(true);
      onTradeRejected?.();

      Toast.show({
        type: 'info',
        text1: '거래를 거절했습니다',
        text2: '다른 거래를 찾아보세요.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 거절 실패',
        text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [product, isLoading, isAccepted, isRejected, onTradeRejected]);

  return {
    handleAcceptTrade,
    handleRejectTrade,
    isLoading,
    isAccepted,
    isRejected,
  };
};
