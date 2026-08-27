import { View, Text, TouchableOpacity } from 'react-native';
import { memo, useMemo } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
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
  isLast?: boolean;
  isFollowedByGrouped?: boolean;
  showTime?: boolean;
}

const MyMessageComponent: React.FC<MyMessageProps> = ({
  message,
  isLast = false,
  isFollowedByGrouped = false,
  showTime = true,
}) => {
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

  const statusIndicator = useMemo(() => {
    if (message.status === MESSAGE_STATUS.FAILED) {
      return <Icon name="alert-circle-outline" size={14} color="#DF454A" />;
    }
    if (!isLast) {
      return null;
    }
    return <Text className="text-xs text-gray-500">{message.checked ? '읽음' : '전송됨'}</Text>;
  }, [message.status, message.checked, isLast]);

  const handleRetry = () => {
    if (message.tempId && message.status === MESSAGE_STATUS.FAILED) {
      retryMessage(message.tempId);
    }
  };

  if (!content) return null;

  return (
    <View className={`items-end ${isFollowedByGrouped ? 'mb-1' : 'mb-4'}`}>
      <View className="flex-row items-end">
        <View className="mr-2 items-end">
          {statusIndicator}
          {showTime && (
            <Text className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</Text>
          )}
        </View>
        <View className="max-w-[280px] rounded-[100px] bg-orange-400 px-4 py-3">{content}</View>
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
