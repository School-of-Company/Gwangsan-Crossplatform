import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <View className="flex w-full gap-2">
      <Text className="text-label">{label}</Text>
      <TextInput
        className="w-full rounded-[12px] border border-solid border-gray-400 px-4 py-5 text-body5 focus:border-sub2-500"
        {...props}
      />
    </View>
  );
}
