import { View, Text } from 'react-native';
import { memo } from 'react';
import {
  useImageLoader,
  formatMessageTime,
  renderMessageContent,
  type MessageRenderConfig,
  type ChatMessageResponse,
} from '@/entity/chat';

interface MyMessageProps {
  message: ChatMessageResponse;
}

const MyMessageComponent: React.FC<MyMessageProps> = ({ message }) => {
  const imageLoader = useImageLoader();

  const messageConfig: MessageRenderConfig = {
    variant: 'sent',
    bgColor: 'bg-orange-400',
    textColor: 'text-white',
    errorIconColor: '#FB923C',
    errorBgColor: 'bg-orange-100',
    errorTextColor: 'text-orange-600',
    loadingBgColor: 'bg-orange-400',
  };

  const content = renderMessageContent(message, imageLoader, messageConfig);

  if (!content) return null;

  return (
    <View className="mb-4 items-end">
      <View className="flex-row items-end">
        <Text className="mr-2 text-xs text-gray-500">{formatMessageTime(message.createdAt)}</Text>
        <View className="max-w-[280px] rounded-2xl rounded-br-md bg-orange-400 px-4 py-3">
          {content}
        </View>
      </View>
    </View>
  );
};

export const MyMessage = memo(MyMessageComponent);
