import { View } from 'react-native';
import { Input } from '~/shared/ui/Input';

interface Props {
  point: string;
  readonly?: boolean;
  onPointChange?: (point: string) => void;
}

const ItemFormPointContainer = ({ point, readonly = false, onPointChange }: Props) => {
  return (
    <View className="px-6 py-4">
      <Input
        label="광산"
        placeholder="광산을 입력해주세요"
        value={point}
        onChangeText={onPointChange}
        editable={!readonly}
        keyboardType="numeric"
      />
    </View>
  );
};

export default ItemFormPointContainer;
