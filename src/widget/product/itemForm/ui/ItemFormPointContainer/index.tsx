import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '~/shared/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  point: string;
  onPointChange: (point: string) => void;
}

const ItemFormPointContainer = ({ point, onPointChange }: Props) => {
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
            onChangeText={onPointChange}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ItemFormPointContainer;
