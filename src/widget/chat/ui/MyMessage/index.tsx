import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { memo, useMemo, useRef } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import {
  useImageLoader,
  formatMessageTime,
  renderMessageContent,
  type MessageRenderConfig,
} from '@/entity/chat';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { EnhancedChatMessage } from '~/entity/chat/model/useChatMessages';
import type { MessageAnchor } from '../../model/useMessageActions';
import { measureAnchor } from '../../model/measureAnchor';

interface MyMessageProps {
  message: EnhancedChatMessage;
  isLast?: boolean;
  isFollowedByGrouped?: boolean;
  showTime?: boolean;
  // 수정/삭제할 수 있는 메시지일 때만 전달된다(ChatRoomContent에서 판단)
  onLongPress?: (message: EnhancedChatMessage, anchor: MessageAnchor) => void;
}

const MyMessageComponent: React.FC<MyMessageProps> = ({
  message,
  isLast = false,
  isFollowedByGrouped = false,
  showTime = true,
  onLongPress,
}) => {
  const imageLoader = useImageLoader();
  const bubbleRef = useRef<View>(null);
  const retryMessage = useChatQueueStore((state) => state.retry);

  const messageConfig: MessageRenderConfig = {
    variant: 'sent',
    bgColor: 'bg-orange-400',
    textColor: 'text-white',
    errorIconColor: '#FB923C',
    errorBgColor: 'bg-orange-100 dark:bg-orange-950',
    errorTextColor: 'text-orange-600',
    loadingBgColor: 'bg-orange-400',
  };

  const content = renderMessageContent(message, imageLoader, messageConfig);
  const isImageMessage = message.messageType === 'IMAGE' && (message.images?.length ?? 0) > 0;

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

  // 메뉴에서 같은 자리에 말풍선을 띄울 수 있도록 화면상 위치를 재서 넘긴다
  const handleLongPress = () => {
    if (!onLongPress) return;
    measureAnchor(bubbleRef.current, (anchor) => onLongPress(message, anchor));
  };

  if (!content) return null;

  return (
    <View className={`items-end ${isFollowedByGrouped ? 'mb-1' : 'mb-4'}`}>
      <View className="flex-row items-end">
        <View className="mr-2 items-end">
          {statusIndicator}
          {message.editedAt ? <Text className="text-xs text-gray-400">(수정됨)</Text> : null}
          {showTime && (
            <Text className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</Text>
          )}
        </View>
        <Pressable
          ref={bubbleRef}
          testID={`my-message-bubble-${message.messageId}`}
          onLongPress={onLongPress ? handleLongPress : undefined}
          disabled={!onLongPress}
          accessibilityHint={onLongPress ? '길게 눌러 수정하거나 삭제할 수 있어요' : undefined}
          className={
            isImageMessage ? 'max-w-[280px]' : 'max-w-[280px] rounded-3xl bg-orange-400 px-4 py-3'
          }>
          {content}
        </Pressable>
      </View>

      {message.status === MESSAGE_STATUS.FAILED && (
        <TouchableOpacity onPress={handleRetry} className="mt-1 flex-row items-center">
          <Icon name="refresh-outline" size={14} color="#DF454A" />
          <Text className="ml-1 text-xs text-foreground">재전송</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const MyMessage = memo(MyMessageComponent);
