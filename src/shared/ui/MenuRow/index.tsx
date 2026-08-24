import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface MenuRowProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string;
  isLast?: boolean;
  showChevron?: boolean;
  labelClassName?: string;
}

export const MenuRow = ({
  label,
  isLast = false,
  showChevron = true,
  labelClassName = 'text-gray-900',
  disabled = false,
  ...props
}: MenuRowProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      className={`h-[56px] flex-row items-center justify-between px-6 ${
        isLast ? '' : 'border-b border-gray-100'
      } ${disabled ? 'opacity-50' : ''}`}
      {...props}>
      <Text className={`text-body2 ${labelClassName}`}>{label}</Text>
      {showChevron && <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />}
    </TouchableOpacity>
  );
};
