import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useChatRooms,
  ChatRoomItem,
  useChatSocket,
  useDeleteChatRoom,
  chatRoomKeys,
  chatMessageKeys,
  getChatRoomData,
} from '@/entity/chat';
import type { ChatRoomListItem } from '@/entity/chat';
import type { RoomId } from '@/shared/types/chatType';
import { AlertModal } from '~/shared/ui/AlertModal';

export function ChatRoomList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: chatRooms, isLoading, refetch, isError } = useChatRooms();
  const [deleteTargetRoomId, setDeleteTargetRoomId] = useState<RoomId | null>(null);

  const { joinRoom } = useChatSocket({
    autoConnect: true,
    chatRoomQueryKey: chatRoomKeys.list(),
  });

  const deleteChatRoomMutation = useDeleteChatRoom();

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

  const handleChatRoomLongPress = useCallback((roomId: RoomId) => {
    setDeleteTargetRoomId(roomId);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteTargetRoomId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTargetRoomId === null) return;
    deleteChatRoomMutation.mutate(deleteTargetRoomId);
    setDeleteTargetRoomId(null);
  }, [deleteTargetRoomId, deleteChatRoomMutation]);

  const renderChatRoomItem = useCallback(
    ({ item }: { item: ChatRoomListItem }) => (
      <ChatRoomItem
        room={item}
        onPress={handleChatRoomPress}
        onLongPress={handleChatRoomLongPress}
      />
    ),
    [handleChatRoomPress, handleChatRoomLongPress]
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
    <>
      <FlatList
        data={chatRooms || []}
        renderItem={renderChatRoomItem}
        keyExtractor={(item) => item.roomId.toString()}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      />

      <AlertModal
        isVisible={deleteTargetRoomId !== null}
        message={'채팅방을 삭제하시겠어요?\n삭제해도 거래 내역은 유지됩니다.'}
        confirmText="삭제"
        destructive
        isLoading={deleteChatRoomMutation.isPending}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
