import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { memo, useMemo } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  useImageLoader,
  formatMessageTime,
  renderMessageContent,
  type MessageRenderConfig,
} from '@/entity/chat';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { EnhancedChatMessage } from '~/entity/chat/model/useChatMessages';

interface MyMessageProps {
  message: EnhancedChatMessage;
}

const MyMessageComponent: React.FC<MyMessageProps> = ({ message }) => {
  const imageLoader = useImageLoader();
  const retryMessage = useChatQueueStore((state) => state.retry);

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

  const statusIcon = useMemo(() => {
    const status = message.status;

    if (status === MESSAGE_STATUS.PENDING) {
      return <Icon name="time-outline" size={14} color="#B4B5B7" />;
    }
    if (status === MESSAGE_STATUS.SENDING) {
      return <ActivityIndicator size="small" color="#B4B5B7" />;
    }
    if (status === MESSAGE_STATUS.FAILED) {
      return <Icon name="alert-circle-outline" size={14} color="#DF454A" />;
    }
    return <Icon name="checkmark-outline" size={14} color="#10B981" />;
  }, [message.status]);

  const handleRetry = () => {
    if (message.tempId && message.status === MESSAGE_STATUS.FAILED) {
      retryMessage(message.tempId);
    }
  };

  if (!content) return null;

  return (
    <View className="mb-4 items-end">
      <View className="flex-row items-end">
        <View className="mr-2 flex-row items-center gap-1">
          {statusIcon}
          <Text className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</Text>
        </View>
        <View className="max-w-[280px] rounded-xl bg-orange-400 px-4 py-3">{content}</View>
      </View>

      {message.status === MESSAGE_STATUS.FAILED && (
        <TouchableOpacity onPress={handleRetry} className="mt-1 flex-row items-center">
          <Icon name="refresh-outline" size={14} color="#DF454A" />
          <Text className="ml-1 text-xs">재전송</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const MyMessage = memo(MyMessageComponent);
