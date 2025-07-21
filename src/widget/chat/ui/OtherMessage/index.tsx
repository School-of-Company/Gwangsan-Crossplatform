import { View, Text } from 'react-native';
import type { ChatMessageResponse } from '@/entity/chat';
import Icon from 'react-native-vector-icons/Ionicons';

interface OtherMessageProps {
  message: ChatMessageResponse;
}

export const OtherMessage: React.FC<OtherMessageProps> = ({ message }) => {
  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View className="mb-4 items-start">
      <View className="flex-row items-start">
        <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-gray-300">
          <Icon name="person" size={16} color="#9CA3AF" />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-xs text-gray-600">{message.senderNickname}</Text>
          <View className="flex-row items-end">
            <View className="max-w-[280px] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
              {message.messageType === 'TEXT' && message.content && (
                <Text className="text-base text-gray-900">{message.content}</Text>
              )}
              {message.messageType === 'IMAGE' && message.images && (
                <View className="h-48 w-64 overflow-hidden rounded-2xl bg-gray-200">
                  <View className="flex-1 items-center justify-center bg-gray-100">
                    <Icon name="image" size={40} color="#9CA3AF" />
                    <Text className="mt-2 text-xs text-gray-600">이미지</Text>
                  </View>
                </View>
              )}
            </View>
            <Text className="ml-2 text-xs text-gray-500">{formatTime(message.createdAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
