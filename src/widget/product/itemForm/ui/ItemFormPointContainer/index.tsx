import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '~/shared/ui/Input';
import { Button } from '~/shared/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onNext: () => void;
}

const ItemFormPointContainer = ({ onNext }: Props) => {
  const [point, setPoint] = useState('');
  const isValid = point.trim().length > 0;
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="pt-safe pb-safe flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 justify-between px-6">
        <View>
          <Input
            label="광산"
            placeholder="광산을 입력해주세요"
            value={point}
            onChangeText={setPoint}
          />
        </View>
        <View className="mb-4">
          <Button disabled={!isValid} onPress={onNext}>
            다음
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ItemFormPointContainer;
