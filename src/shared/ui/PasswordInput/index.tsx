import { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { Input } from '@/shared/ui/Input';
import { useThemeColors } from '@/shared/lib/theme';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ label, ...props }, ref) => {
    const colors = useThemeColors();
    const [isVisible, setIsVisible] = useState(false);

    return (
      <Input
        ref={ref}
        label={label}
        secureTextEntry={!isVisible}
        icon={
          <TouchableOpacity onPress={() => setIsVisible((prev) => !prev)}>
            <Icon
              name={isVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors['gray-400']}
            />
          </TouchableOpacity>
        }
        {...props}
      />
    );
  }
);
