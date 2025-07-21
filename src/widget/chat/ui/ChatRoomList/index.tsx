import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useChatRooms, ChatRoomItem } from '@/entity/chat';
import type { ChatRoomListItem } from '@/entity/chat';
import type { RoomId } from '@/shared/types/chatType';

export function ChatRoomList() {
  const router = useRouter();
  const { data: chatRooms, isLoading, refetch, isError } = useChatRooms();

  const handleChatRoomPress = useCallback(
    (roomId: RoomId) => {
      router.push(`/chat/${roomId}`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderChatRoomItem = useCallback(
    ({ item }: { item: ChatRoomListItem }) => (
      <ChatRoomItem room={item} onPress={handleChatRoomPress} />
    ),
    [handleChatRoomPress]
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-base text-gray-500">아직 채팅방 없습니다</Text>
    </View>
  );

  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-base text-red-500">채팅방 목록을 불러올 수 없습니다</Text>
    </View>
  );

  if (isError) {
    return renderErrorState();
  }

  return (
    <FlatList
      data={chatRooms || []}
      renderItem={renderChatRoomItem}
      keyExtractor={(item) => item.roomId.toString()}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      className="flex-1"
    />
  );
}
