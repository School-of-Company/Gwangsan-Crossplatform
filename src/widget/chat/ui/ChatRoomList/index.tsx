import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useChatRooms,
  ChatRoomItem,
  useChatSocket,
  chatRoomKeys,
  chatMessageKeys,
  getChatRoomData,
} from '@/entity/chat';
import type { ChatRoomListItem } from '@/entity/chat';
import type { RoomId } from '@/shared/types/chatType';

export function ChatRoomList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: chatRooms, isLoading, refetch, isError } = useChatRooms();

  const { joinRoom } = useChatSocket({
    autoConnect: true,
    chatRoomQueryKey: chatRoomKeys.list(),
  });

  const handleChatRoomPress = useCallback(
    (roomId: RoomId) => {
      // 채팅방에 들어가기 전에 데이터를 미리 받아오고 소켓 방에 미리 join해
      // 화면 전환 애니메이션이 끝났을 때 목록에서 보던 내용이 바로 보이게 한다.
      queryClient
        .fetchQuery({
          queryKey: ['chatRoomData', roomId],
          queryFn: () => getChatRoomData(roomId),
          staleTime: 30 * 1000,
        })
        .then((data) => {
          queryClient.setQueryData(chatMessageKeys.room(roomId), [...data.messages]);
        })
        .catch(() => {});

      joinRoom(roomId);
      router.push(`/chatting/${roomId}`);
    },
    [router, queryClient, joinRoom]
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
