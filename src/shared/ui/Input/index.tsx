import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, ...props }: InputProps) {
  return (
    <View className="flex w-full gap-2">
      <Text className="text-label">{label}</Text>
      <View className="relative">
        <TextInput
          className="w-full rounded-xl border border-gray-400 px-4 py-5 text-body5 focus:border-sub2-500"
          {...props}
        />
        {icon && (
          <View className="absolute right-4 top-0 bottom-0 flex justify-center">
            {icon}
          </View>
        )}
      </View>
    </View>
  );
}
