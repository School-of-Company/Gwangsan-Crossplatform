import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { requestTrade } from '../api/requestTrade';
import { useChatNavigation } from '~/shared/lib/useChatEntry';

interface UseTradeRequestOptions {
  readonly productId: number;
  readonly sellerId: number;
}

interface UseTradeRequestReturn {
  readonly handleTradeRequest: () => Promise<void>;
  readonly isLoading: boolean;
}

export const useTradeRequest = ({
  productId,
  sellerId,
}: UseTradeRequestOptions): UseTradeRequestReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { navigateToChat } = useChatNavigation();
  const router = useRouter();

  const handleTradeRequest = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const response = await requestTrade({
        productId,
        otherMemberId: sellerId,
      });

      Toast.show({
        type: 'success',
        text1: '거래 신청이 전송되었습니다',
        text2: '채팅방에서 대화를 시작해보세요!',
      });

      try {
        if (response.roomId) {
          router.push(`/chatting/${response.roomId}`);
        } else {
          await navigateToChat(productId);
        }
      } catch (navigationError) {
        console.error(navigationError);
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
  }, [productId, sellerId, isLoading, navigateToChat, router]);

  return {
    handleTradeRequest,
    isLoading,
  };
};
