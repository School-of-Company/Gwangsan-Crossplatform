import { Text, View } from 'react-native';
import { BottomSheetModalWrapper } from '~/shared/ui/BottomSheetModalWrapper';
import { Button, Input } from '~/shared/ui';

interface ReservationPlaceNameSheetProps {
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly address: string;
  readonly placeName: string;
  readonly onChangePlaceName: (value: string) => void;
  readonly onConfirm: () => void;
}

export function ReservationPlaceNameSheet({
  isVisible,
  onClose,
  address,
  placeName,
  onChangePlaceName,
  onConfirm,
}: ReservationPlaceNameSheetProps) {
  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      title="장소명 입력"
      hasHeader={false}
      height={260}>
      <View className="flex-1 gap-4">
        <Text className="text-body5 text-gray-500">{address}</Text>

        <Input
          label="장소명"
          value={placeName}
          onChangeText={onChangePlaceName}
          placeholder="예: 상무역 2번 출구"
          returnKeyType="done"
          autoFocus
        />

        <Button variant="primary" onPress={onConfirm} disabled={!placeName.trim()} width="w-full">
          <Text className="text-white">확인</Text>
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
}
