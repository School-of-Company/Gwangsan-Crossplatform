import { useRef } from 'react';
import { Text, TextInput, View } from 'react-native';
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
  const inputRef = useRef<TextInput>(null);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      title="장소명 입력"
      hasHeader={false}
      height={280}
      // 시트가 슬라이드업되는 도중에 포커스를 주면(autoFocus) 안드로이드에서
      // 한글 입력 시 자소가 분리되는 문제가 있어, 애니메이션이 끝난 뒤에만 포커스한다.
      onOpenAnimationComplete={() => inputRef.current?.focus()}>
      <View className="flex-1 gap-4">
        <Text className="text-body5 text-gray-500">{address}</Text>

        <Input
          ref={inputRef}
          label="장소명"
          // 타이핑할 때마다 부모의 controlled value를 다시 흘려보내면(value=placeName)
          // 안드로이드 한글 입력 중 조합(IME composing) 상태가 끊겨 자소가 분리된다.
          // defaultValue로 최초 값만 반영하고, 이후 입력은 onChangeText로만 흘려보낸다.
          defaultValue={placeName}
          onChangeText={onChangePlaceName}
          placeholder="예: 상무역 2번 출구"
          returnKeyType="done"
        />

        <Button variant="primary" onPress={onConfirm} disabled={!placeName.trim()} width="w-full">
          <Text className="text-white">확인</Text>
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
}
