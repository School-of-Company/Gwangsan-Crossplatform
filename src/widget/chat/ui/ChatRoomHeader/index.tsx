import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
      <View className="items-center py-8">
        <TouchableOpacity onPress={onProfilePress} disabled={!otherUserId}>
          <Text className="mb-2 text-xl font-bold text-gray-900">{otherUserNickname}</Text>
        </TouchableOpacity>
        <Text className="text-sm text-gray-500">{lastMessageDate}</Text>
      </View>
    </View>
  );
};
