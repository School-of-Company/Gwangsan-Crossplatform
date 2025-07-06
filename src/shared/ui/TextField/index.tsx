import { TextInput, TextInputProps, View, Text } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <View className="flex w-full gap-2">
      <Text className="text-label">{label}</Text>
      <TextInput
        className="max-h-[200px] min-h-[120px] w-full rounded-xl border border-gray-400 px-4 py-5 text-body5 focus:border-sub2-500"
        multiline
        textAlignVertical="top"
        {...props}
      />
    </View>
  );
}
