import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useChatRooms } from '@/entity/chat';
import { ChatRoomItem } from '@/entity/chat';
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
      <Text className="text-base text-gray-500">아직 채팅방이 없습니다</Text>
      <Text className="mt-2 text-sm text-gray-400">새로운 채팅을 시작해보세요</Text>
    </View>
  );

  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-base text-red-500">채팅방 목록을 불러올 수 없습니다</Text>
      <Text className="mt-2 text-sm text-gray-400">새로고침을 시도해주세요</Text>
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
