import { View, Text, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { ChatMessageResponse } from '../model/chatTypes';
import type { UseImageLoaderReturn } from '../model/useImageLoader';

export interface MessageRenderConfig {
  variant: 'sent' | 'received';
  bgColor: string;
  textColor: string;
  errorIconColor: string;
  errorBgColor: string;
  errorTextColor: string;
  loadingBgColor: string;
}

export const formatMessageTime = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const renderMessageImages = (
  message: ChatMessageResponse,
  imageLoader: UseImageLoaderReturn,
  config: MessageRenderConfig
) => {
  if (message.messageType !== 'IMAGE' || !message.images || message.images.length === 0) {
    return null;
  }

  return (
    <View className="max-w-[250px]">
      {message.images.map((image) => (
        <View key={image.imageId} className="relative mb-1">
          {imageLoader.hasImageError(image.imageId) ? (
            <View
              className={`h-48 w-48 items-center justify-center rounded-lg ${config.errorBgColor}`}>
              <Icon name="image-outline" size={32} color={config.errorIconColor} />
              <Text className={`mt-1 text-xs ${config.errorTextColor}`}>이미지 로드 실패</Text>
            </View>
          ) : (
            <Image
              source={{ uri: image.imageUrl }}
              className="h-48 w-48 rounded-lg"
              resizeMode="cover"
              onLoadStart={() => imageLoader.handleImageLoadStart(image.imageId)}
              onLoadEnd={() => imageLoader.handleImageLoadEnd(image.imageId)}
              onError={() => imageLoader.handleImageError(image.imageId)}
            />
          )}
          {imageLoader.isImageLoading(image.imageId) && (
            <View
              className={`absolute inset-0 items-center justify-center rounded-lg ${config.loadingBgColor} bg-opacity-50`}>
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
        </View>
      ))}
      {message.content && (
        <Text className={`mt-1 text-sm ${config.textColor}`}>{message.content}</Text>
      )}
    </View>
  );
};

export const renderMessageText = (message: ChatMessageResponse, config: MessageRenderConfig) => {
  if (message.messageType !== 'TEXT' || !message.content) {
    return null;
  }

  return <Text className={`text-base ${config.textColor}`}>{message.content}</Text>;
};

export const renderMessageContent = (
  message: ChatMessageResponse,
  imageLoader: UseImageLoaderReturn,
  config: MessageRenderConfig
) => {
  if (message.messageType === 'IMAGE' && message.images && message.images.length > 0) {
    return renderMessageImages(message, imageLoader, config);
  }

  if (message.messageType === 'TEXT' && message.content) {
    return renderMessageText(message, config);
  }

  return null;
};
