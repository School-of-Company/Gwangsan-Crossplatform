import { TextInput, TextInputProps, View, Text } from 'react-native';
import { forwardRef } from 'react';

interface InputProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, icon, ...props }, ref) => {
  return (
    <View className="flex w-full gap-2">
      <Text className="text-label">{label}</Text>
      <View className="relative">
        <TextInput
          ref={ref}
          className="w-full rounded-xl border border-gray-400 px-4 py-5 text-body5 focus:border-sub2-500"
          returnKeyType="next"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={true}
          {...props}
        />
        {icon && (
          <View className="absolute bottom-0 right-4 top-0 flex justify-center">{icon}</View>
        )}
      </View>
    </View>
  );
});
