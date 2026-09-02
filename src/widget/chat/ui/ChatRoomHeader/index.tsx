import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ChatRoomHeaderProps {
  readonly otherUserNickname: string;
  readonly otherUserId?: number;
  readonly lastMessageDate: string;
  readonly onProfilePress: () => void;
}

export const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  otherUserNickname,
  otherUserId,
  lastMessageDate,
  onProfilePress,
}) => {
  return (
    <View className="bg-white">
      <View className="flex-row items-center justify-between px-4 py-8">
        <View className="w-8" />
        <View className="items-center">
          <TouchableOpacity onPress={onProfilePress} disabled={!otherUserId}>
            <Text className="mb-2 text-xl font-bold text-gray-900">{otherUserNickname}</Text>
          </TouchableOpacity>
          <Text className="text-sm text-gray-500">{lastMessageDate}</Text>
        </View>
        <View className="w-8" />
      </View>
    </View>
  );
};
