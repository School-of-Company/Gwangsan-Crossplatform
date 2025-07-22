import { View, Text } from 'react-native';
import { memo } from 'react';
import {
  useImageLoader,
  formatMessageTime,
  renderMessageContent,
  type MessageRenderConfig,
  type ChatMessageResponse,
} from '@/entity/chat';
import Icon from 'react-native-vector-icons/Ionicons';

interface OtherMessageProps {
  message: ChatMessageResponse;
}

const OtherMessageComponent: React.FC<OtherMessageProps> = ({ message }) => {
  const imageLoader = useImageLoader();

  const messageConfig: MessageRenderConfig = {
    variant: 'received',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-900',
    errorIconColor: '#9CA3AF',
    errorBgColor: 'bg-gray-100',
    errorTextColor: 'text-gray-600',
    loadingBgColor: 'bg-gray-500',
  };

  const content = renderMessageContent(message, imageLoader, messageConfig);

  if (!content) return null;

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
              {content}
            </View>
            <Text className="ml-2 text-xs text-gray-500">
              {formatMessageTime(message.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const OtherMessage = memo(OtherMessageComponent);
