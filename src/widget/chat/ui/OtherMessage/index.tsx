import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import type { ChatMessageResponse } from '@/entity/chat';
import Icon from 'react-native-vector-icons/Ionicons';

interface OtherMessageProps {
  message: ChatMessageResponse;
}

export const OtherMessage: React.FC<OtherMessageProps> = ({ message }) => {
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [imageErrorStates, setImageErrorStates] = useState<{ [key: number]: boolean }>({});

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleImageLoadStart = (imageId: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [imageId]: true }));
  };

  const handleImageLoadEnd = (imageId: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [imageId]: false }));
  };

  const handleImageError = (imageId: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [imageId]: false }));
    setImageErrorStates((prev) => ({ ...prev, [imageId]: true }));
  };

  const renderContent = () => {
    if (message.messageType === 'IMAGE' && message.images && message.images.length > 0) {
      return (
        <View className="max-w-[250px]">
          {message.images.map((image, index) => (
            <View key={image.imageId} className="relative mb-1">
              {imageErrorStates[image.imageId] ? (
                <View className="h-48 w-48 items-center justify-center rounded-lg bg-gray-100">
                  <Icon name="image-outline" size={32} color="#9CA3AF" />
                  <Text className="mt-1 text-xs text-gray-600">이미지 로드 실패</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: image.imageUrl }}
                  className="h-48 w-48 rounded-lg"
                  resizeMode="cover"
                  onLoadStart={() => handleImageLoadStart(image.imageId)}
                  onLoadEnd={() => handleImageLoadEnd(image.imageId)}
                  onError={() => handleImageError(image.imageId)}
                />
              )}
              {imageLoadingStates[image.imageId] && (
                <View className="absolute inset-0 items-center justify-center rounded-lg bg-gray-500 bg-opacity-50">
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </View>
          ))}
          {message.content && <Text className="mt-1 text-sm text-gray-800">{message.content}</Text>}
        </View>
      );
    }

    if (message.messageType === 'TEXT' && message.content) {
      return <Text className="text-base text-gray-900">{message.content}</Text>;
    }

    return null;
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
              {renderContent()}
            </View>
            <Text className="ml-2 text-xs text-gray-500">{formatTime(message.createdAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
