import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ChatRoomHeaderProps {
  readonly otherUserNickname: string;
  readonly otherUserId?: number;
  readonly lastMessageDate: string;
  readonly onProfilePress: () => void;
  readonly onMenuPress?: () => void;
  readonly showMenuButton?: boolean;
}

export const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  otherUserNickname,
  otherUserId,
  lastMessageDate,
  onProfilePress,
  onMenuPress,
  showMenuButton = false,
}) => {
  return (
    <View className="bg-white">
      <View className="items-center py-8">
        <View className="flex-row items-center justify-center">
          <TouchableOpacity onPress={onProfilePress} disabled={!otherUserId}>
            <Text className="mb-2 text-xl font-bold text-gray-900">{otherUserNickname}</Text>
          </TouchableOpacity>
          {showMenuButton && (
            <TouchableOpacity
              onPress={onMenuPress}
              className="absolute right-0 p-2"
              style={{ right: 0 }}>
              <Icon name="ellipsis-vertical" size={24} />
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-sm text-gray-500">{lastMessageDate}</Text>
      </View>
    </View>
  );
};
