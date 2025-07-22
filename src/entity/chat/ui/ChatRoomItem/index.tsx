import { View, Text, TouchableOpacity } from 'react-native';
import { memo } from 'react';
import { formatDate } from '@/shared/lib/formatDate';
import type { ChatRoomListItem } from '../../model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';

interface ChatRoomItemProps {
  room: ChatRoomListItem;
  onPress: (roomId: RoomId) => void;
}

const ChatRoomItemComponent = ({ room, onPress }: ChatRoomItemProps) => {
  const handlePress = () => {
    onPress(room.roomId);
  };

  const renderUnreadBadge = () => {
    if (room.unreadMessageCount === 0) return null;

    return (
      <View className="min-w-[20px] items-center justify-center rounded-full bg-yellow-400 px-1.5 py-0.5">
        <Text className="text-xs font-semibold text-white">{room.unreadMessageCount}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center border-b border-gray-100 px-4 py-3 active:bg-gray-50"
      activeOpacity={0.7}>
      <View className="flex-1">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {room.member.nickname}
          </Text>
          <View className="flex-row items-center space-x-2">
            <Text className="text-xs text-gray-400">{formatDate(room.lastMessageTime)}</Text>
            {renderUnreadBadge()}
          </View>
        </View>
        <Text className="text-sm text-gray-600" numberOfLines={1}>
          {room.lastMessageType === 'IMAGE' ? '📷 사진' : room.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const ChatRoomItem = memo(ChatRoomItemComponent);
