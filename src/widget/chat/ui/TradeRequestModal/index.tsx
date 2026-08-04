import React, { memo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { BottomSheetModalWrapper, Button } from '~/shared/ui';

interface TradeRequestModalProps {
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly onTradeRequest: () => void;
  readonly onAnimationComplete?: () => void;
  readonly isLoading?: boolean;
}

const TradeRequestModalComponent: React.FC<TradeRequestModalProps> = ({
  isVisible,
  onClose,
  onTradeRequest,
  onAnimationComplete,
  isLoading = false,
}) => {
  const handleTradeRequest = useCallback(() => {
    onTradeRequest();
    onClose();
  }, [onTradeRequest, onClose]);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      onAnimationComplete={onAnimationComplete}
      title=""
      hasHeader={false}
      height={220}>
      <View className="flex-1 justify-center gap-3">
        <Button variant="primary" onPress={handleTradeRequest} disabled={isLoading} width="w-full">
          <Text className="text-white">{isLoading ? '요청 중...' : '거래 요청'}</Text>
        </Button>

        <Button variant="neutral" onPress={onClose} disabled={isLoading} width="w-full">
          <Text className="text-gray-900">닫기</Text>
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export const TradeRequestModal = memo(TradeRequestModalComponent);
TradeRequestModal.displayName = 'TradeRequestModal';
