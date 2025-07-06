import { View } from 'react-native';
import { Input } from '~/shared/ui/Input';
import { memo } from 'react';

interface Props {
  gwangsan: string;
  readonly?: boolean;
  onGwangsanChange?: (gwangsan: string) => void;
}

const ItemFormGwangsan = ({ gwangsan, readonly = false, onGwangsanChange }: Props) => {
  return (
    <View className="px-6">
      <Input
        label="광산"
        placeholder="광산을 입력해주세요"
        value={gwangsan}
        onChangeText={onGwangsanChange}
        editable={!readonly}
        keyboardType="numeric"
      />
    </View>
  );
};

export default memo(ItemFormGwangsan);
