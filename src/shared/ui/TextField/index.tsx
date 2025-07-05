import { TextInput, TextInputProps, View, Text } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <View className="flex w-full gap-2">
      <Text className="text-label">{label}</Text>
      <TextInput
        className="w-full rounded-xl border border-gray-400 px-4 py-5 text-body5 focus:border-sub2-500"
        multiline
        textAlignVertical="top"
        style={{ minHeight: 120, maxHeight: 200 }}
        {...props}
      />
    </View>
  );
}
