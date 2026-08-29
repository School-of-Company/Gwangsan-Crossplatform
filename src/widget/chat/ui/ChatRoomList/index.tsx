import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
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
import { BottomSheetModalWrapper } from '~/shared/ui/BottomSheetModalWrapper';
import { Button } from '~/shared/ui/Button';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';

const CHAT_ROOM_QUERY_KEY = chatRoomKeys.list();

export function ChatRoomList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: chatRooms, isLoading, refetch, isError } = useChatRooms();
  const [deleteTargetRoomId, setDeleteTargetRoomId] = useState<RoomId | null>(null);
  // 슬라이드 아웃 애니메이션이 진행 중인 채팅방 (목록 데이터에는 아직 남아있음)
  const [exitingRoomId, setExitingRoomId] = useState<RoomId | null>(null);
  // 슬라이드 아웃이 끝나 실제로 목록에서 제거된 채팅방 — 이 시점부터 위/아래 항목이 붙는 애니메이션이 재생된다
  const [hiddenRoomIds, setHiddenRoomIds] = useState<Set<RoomId>>(() => new Set());
  const hasRooms = (chatRooms?.length ?? 0) > 0;

  const { joinRoom } = useChatSocket({
    autoConnect: true,
    chatRoomQueryKey: CHAT_ROOM_QUERY_KEY,
  });

  const deleteChatRoomMutation = useDeleteChatRoom();

  const visibleChatRooms = useMemo(
    () => (chatRooms ?? []).filter((room) => !hiddenRoomIds.has(room.roomId)),
    [chatRooms, hiddenRoomIds]
  );

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

    // 슬라이드 아웃 애니메이션은 API 응답과 무관하게 먼저 재생한다 — 낙관적 업데이트.
    // 실제 삭제 요청은 애니메이션이 끝나 목록에서 제거된 뒤 handleChatRoomExited에서 보낸다.
    setExitingRoomId(deleteTargetRoomId);
    setDeleteTargetRoomId(null);
  }, [deleteTargetRoomId]);

  const handleChatRoomExited = useCallback(
    (roomId: RoomId) => {
      // 슬라이드 아웃이 끝난 뒤에만 목록에서 제거해야 위/아래 항목이 붙는 애니메이션이 이어서 재생된다
      setHiddenRoomIds((prev) => {
        const next = new Set(prev);
        next.add(roomId);
        return next;
      });
      setExitingRoomId(null);

      deleteChatRoomMutation.mutate(roomId, {
        onError: () => {
          // 나가기가 실패하면 토스트로 알리고 숨겼던 항목을 다시 목록에 되돌린다
          setHiddenRoomIds((prev) => {
            if (!prev.has(roomId)) return prev;
            const next = new Set(prev);
            next.delete(roomId);
            return next;
          });
        },
      });
    },
    [deleteChatRoomMutation]
  );

  const renderChatRoomItem = useCallback(
    ({ item }: { item: ChatRoomListItem }) => (
      <ChatRoomItem
        room={item}
        onPress={handleChatRoomPress}
        onLongPress={handleChatRoomLongPress}
        onMenuPress={handleChatRoomLongPress}
        isExiting={item.roomId === exitingRoomId}
        onExited={handleChatRoomExited}
      />
    ),
    [handleChatRoomPress, handleChatRoomLongPress, exitingRoomId, handleChatRoomExited]
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-base text-gray-500">아직 채팅방 없습니다</Text>
    </View>
  );

  // 30초 폴링 중 한 번만 실패해도 status는 error가 되지만 캐시된 목록은 남아 있다.
  // 이미 받아둔 목록이 있으면 그대로 보여주고, 받아둔 목록이 없을 때만 에러 화면으로 대체한다.
  if (isError && !hasRooms) {
    return <ErrorFallback onRetry={refetch} />;
  }

  return (
    <>
      <FlatList
        data={visibleChatRooms}
        renderItem={renderChatRoomItem}
        keyExtractor={(item) => item.roomId.toString()}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        ListEmptyComponent={isLoading ? null : renderEmptyState}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      />

      <BottomSheetModalWrapper
        isVisible={deleteTargetRoomId !== null}
        onClose={handleCancelDelete}
        title=""
        hasHeader={false}
        height={220}>
        <View className="flex-1 justify-center gap-3">
          <Button
            variant="neutral"
            onPress={handleConfirmDelete}
            disabled={deleteChatRoomMutation.isPending}
            width="w-full">
            <Text className="text-error-500">
              {deleteChatRoomMutation.isPending ? '나가는 중...' : '채팅방 나가기'}
            </Text>
          </Button>
          <View className="mb-3">
            <Button
              variant="neutral"
              onPress={handleCancelDelete}
              disabled={deleteChatRoomMutation.isPending}
              width="w-full">
              <Text className="text-gray-900">닫기</Text>
            </Button>
          </View>
        </View>
      </BottomSheetModalWrapper>
    </>
  );
}
