import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface ChatRoomProductInfoProps {
  readonly title: string;
  readonly gwangsan?: number;
  readonly imageUrl?: string;
  readonly trailing?: React.ReactNode;
  readonly onPress?: () => void;
}

export const ChatRoomProductInfo: React.FC<ChatRoomProductInfoProps> = ({
  title,
  gwangsan,
  imageUrl,
  trailing,
  onPress,
}) => {
  return (
    <View testID="chat-room-product-info" className="flex-row items-center gap-3 px-4 py-3">
      <TouchableOpacity
        className="flex-1 flex-row items-center gap-3"
        activeOpacity={0.7}
        disabled={!onPress}
        onPress={onPress}>
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
      </TouchableOpacity>
      {trailing}
    </View>
  );
};
