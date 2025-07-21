import { View, Text } from 'react-native';
import type { ChatMessageResponse } from '@/entity/chat';
import Icon from 'react-native-vector-icons/Ionicons';

interface MyMessageProps {
  message: ChatMessageResponse;
}

export const MyMessage: React.FC<MyMessageProps> = ({ message }) => {
  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View className="mb-4 items-end">
      <View className="flex-row items-end">
        <Text className="mr-2 text-xs text-gray-500">{formatTime(message.createdAt)}</Text>
        <View className="max-w-[280px] rounded-2xl rounded-br-md bg-orange-400 px-4 py-3">
          {message.messageType === 'TEXT' && message.content && (
            <Text className="text-base text-white">{message.content}</Text>
          )}
          {message.messageType === 'IMAGE' && message.images && (
            <View className="h-48 w-64 overflow-hidden rounded-2xl bg-gray-200">
              <View className="flex-1 items-center justify-center bg-orange-100">
                <Icon name="image" size={40} color="#FB923C" />
                <Text className="mt-2 text-xs text-orange-600">이미지</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};