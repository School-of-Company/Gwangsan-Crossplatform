import { ReactNode } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const ICON_SIZE: Record<NonNullable<CheckboxProps['size']>, number> = {
  sm: 18,
  md: 22,
  lg: 28,
};

export function Checkbox({ checked, onPress, label, size = 'md' }: CheckboxProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center gap-3"
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}>
      <Icon
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={ICON_SIZE[size]}
        color={checked ? '#8FC31D' : '#B4B5B7'}
      />
      {label ? (
        typeof label === 'string' ? (
          <Text className="flex-1 text-body4 text-gray-800">{label}</Text>
        ) : (
          <View className="flex-1">{label}</View>
        )
      ) : null}
    </TouchableOpacity>
  );
}
