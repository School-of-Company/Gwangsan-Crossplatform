import React, { memo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { BottomSheetModalWrapper, Button } from '~/shared/ui';

interface ReservationConfirmModalProps {
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly onAnimationComplete?: () => void;
}

const ReservationConfirmModalComponent: React.FC<ReservationConfirmModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  onAnimationComplete,
}) => {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      onAnimationComplete={onAnimationComplete}
      title=""
      hasHeader={false}
      height={220}>
      <View className="flex-1 justify-center gap-3">
        <Button variant="primary" onPress={handleConfirm} width="w-full">
          <Text className="text-white">예약하기</Text>
        </Button>

        <Button variant="neutral" onPress={onClose} width="w-full">
          <Text className="text-gray-900">닫기</Text>
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export const ReservationConfirmModal = memo(ReservationConfirmModalComponent);
ReservationConfirmModal.displayName = 'ReservationConfirmModal';
