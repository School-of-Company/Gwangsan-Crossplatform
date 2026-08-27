import { View, Text } from 'react-native';

interface ChatDateDividerProps {
  readonly label: string;
}

export const ChatDateDivider: React.FC<ChatDateDividerProps> = ({ label }) => (
  <View className="my-3 items-center">
    <View className="rounded-full bg-gray-100 px-3 py-1">
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  </View>
);
