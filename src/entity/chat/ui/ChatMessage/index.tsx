import { View, Text, Image } from 'react-native';
import { memo } from 'react';
import { formatDate } from '@/shared/lib/formatDate';
import type { ChatMessageResponse } from '../../model/chatTypes';

interface ChatMessageProps {
  message: ChatMessageResponse;
}

const ChatMessageComponent = ({ message }: ChatMessageProps) => {
  const isMyMessage = message.isMine;

  const renderContent = () => {
    if (message.messageType === 'IMAGE' && message.images && message.images.length > 0) {
      return (
        <View className={`max-w-[250px] ${isMyMessage ? 'items-end' : 'items-start'}`}>
          {message.images.map((image, index) => (
            <Image
              key={image.imageId}
              source={{ uri: image.imageUrl }}
              className="mb-1 h-48 w-48 rounded-lg"
              resizeMode="cover"
            />
          ))}
          {message.content && (
            <Text className={`text-sm ${isMyMessage ? 'text-white' : 'text-gray-800'} mt-1`}>
              {message.content}
            </Text>
          )}
        </View>
      );
    }

    return (
      <Text className={`text-sm ${isMyMessage ? 'text-white' : 'text-gray-800'}`}>
        {message.content}
      </Text>
    );
  };

  return (
    <View className={`mb-4 ${isMyMessage ? 'items-end' : 'items-start'}`}>
      {!isMyMessage && (
        <Text className="mb-1 ml-1 text-xs text-gray-500">{message.senderNickname}</Text>
      )}

      <View className="max-w-[80%] flex-row items-end">
        {isMyMessage ? (
          <>
            <Text className="mb-1 mr-2 text-xs text-gray-400">{formatDate(message.createdAt)}</Text>
            <View className="max-w-[250px] rounded-2xl rounded-br-md bg-yellow-400 px-4 py-3">
              {renderContent()}
            </View>
          </>
        ) : (
          <>
            <View className="max-w-[250px] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
              {renderContent()}
            </View>
            <Text className="mb-1 ml-2 text-xs text-gray-400">{formatDate(message.createdAt)}</Text>
          </>
        )}
      </View>
    </View>
  );
};

export const ChatMessage = memo(ChatMessageComponent);
ChatMessage.displayName = 'ChatMessage';
