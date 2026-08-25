import React from 'react';
import { View, Text, Image } from 'react-native';

interface ChatRoomProductInfoProps {
  readonly title: string;
  readonly gwangsan?: number;
  readonly imageUrl?: string;
}

export const ChatRoomProductInfo: React.FC<ChatRoomProductInfoProps> = ({
  title,
  gwangsan,
  imageUrl,
}) => {
  return (
    <View
      testID="chat-room-product-info"
      className="flex-row items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <Image
        source={imageUrl ? { uri: imageUrl } : require('~/shared/assets/png/icon.png')}
        className="h-11 w-11 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-label text-gray-900" numberOfLines={1}>
          {title}
        </Text>
        {gwangsan !== undefined && (
          <Text className="text-caption text-gray-500">{gwangsan} 광산</Text>
        )}
      </View>
    </View>
  );
};
