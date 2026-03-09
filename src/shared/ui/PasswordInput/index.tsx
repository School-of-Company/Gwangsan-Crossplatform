import { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Input } from '@/shared/ui/Input';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(({ label, ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      ref={ref}
      label={label}
      secureTextEntry={!isVisible}
      icon={
        <TouchableOpacity onPress={() => setIsVisible((prev) => !prev)}>
          <Icon name={isVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9CA3AF" />
        </TouchableOpacity>
      }
      {...props}
    />
  );
});
