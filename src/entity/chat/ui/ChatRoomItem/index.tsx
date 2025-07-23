import { View, Text, TouchableOpacity, Image } from 'react-native';
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
    if (!room.unreadMessageCount || room.unreadMessageCount === 0) return null;
    return (
      <View className="ml-2 min-w-[20px] items-center justify-center rounded-full bg-yellow-400 px-1.5 py-0.5">
        <Text className="text-xs font-semibold text-white">{room.unreadMessageCount}</Text>
      </View>
    );
  };

  const productImage = room.product?.images?.[0]?.imageUrl;

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center border-b border-gray-100 px-4 py-3 active:bg-gray-50"
      activeOpacity={0.7}>
      <Image
        source={
          productImage ? { uri: productImage } : require('@/shared/assets/png/defaultProfile.png')
        }
        className="mr-3 h-14 w-14 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
          {room.product?.title}
        </Text>
        <Text className="text-sm text-gray-700" numberOfLines={1}>
          {room.member.nickname}
        </Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          {room.lastMessageType === 'IMAGE' ? '📷 사진을 보냈습니다.' : room.lastMessage}
        </Text>
      </View>
      <View className="ml-2 flex-col items-end">
        <Text className="mb-1 text-xs text-gray-400">{formatDate(room.lastMessageTime)}</Text>
        {renderUnreadBadge()}
      </View>
    </TouchableOpacity>
  );
};

export const ChatRoomItem = memo(ChatRoomItemComponent);
