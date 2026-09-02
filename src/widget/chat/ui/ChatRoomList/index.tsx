import { Animated, FlatList, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { BottomSheetModalWrapper } from '~/shared/ui/BottomSheetModalWrapper';
import { Button } from '~/shared/ui/Button';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { ReportModal } from '~/entity/post/ui';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';

const CHAT_ROOM_QUERY_KEY = chatRoomKeys.list();

interface ActionSheetRowProps {
  label: string;
  labelClassName?: string;
  disabled?: boolean;
  onPress?: () => void;
}

// 채팅방 액션 시트(차단/신고/나가기) 버튼 한 줄. 눌렀을 때 살짝 작아지는 효과를 준다.
const ActionSheetRow = ({
  label,
  labelClassName = 'text-gray-900',
  disabled = false,
  onPress,
}: ActionSheetRowProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={disabled ? 'opacity-50' : ''}>
      <Animated.View
        className="h-[56px] items-center justify-center"
        style={{ transform: [{ scale }] }}>
        <Text className={`text-lg font-medium ${labelClassName}`}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export function ChatRoomList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: chatRooms, isLoading, refetch, isError } = useChatRooms();
  // 채팅방별 액션 시트(차단/신고/나가기)가 열려있는 채팅방
  const [actionTargetRoomId, setActionTargetRoomId] = useState<RoomId | null>(null);
  // 신고 모달은 액션 시트가 닫힌 뒤에도 열려있어야 하므로 대상 memberId를 따로 보관한다
  const [reportTargetMemberId, setReportTargetMemberId] = useState<number | undefined>(undefined);
  const [isReportVisible, setIsReportVisible] = useState(false);
  // 슬라이드 아웃 애니메이션이 진행 중인 채팅방 (목록 데이터에는 아직 남아있음)
  const [exitingRoomId, setExitingRoomId] = useState<RoomId | null>(null);
  // 슬라이드 아웃이 끝나 실제로 목록에서 제거된 채팅방 — 이 시점부터 위/아래 항목이 붙는 애니메이션이 재생된다
  const [hiddenRoomIds, setHiddenRoomIds] = useState<Set<RoomId>>(() => new Set());
  // 차단 확인 AlertModal은 액션 시트가 닫힌 뒤에도 열려있어야 하므로 대상을 따로 보관한다.
  // memberId도 함께 저장해, 시트가 닫혀 actionTargetMemberId가 사라진 뒤에도
  // useBlockUser가 올바른 대상에 그대로 묶여 있게 한다.
  const [blockTarget, setBlockTarget] = useState<{
    roomId: RoomId;
    nickname: string;
    memberId: number;
  } | null>(null);
  const hasRooms = (chatRooms?.length ?? 0) > 0;

  const { joinRoom } = useChatSocket({
    autoConnect: true,
    chatRoomQueryKey: CHAT_ROOM_QUERY_KEY,
  });

  const deleteChatRoomMutation = useDeleteChatRoom();

  const actionTargetRoom = useMemo(
    () => chatRooms?.find((room) => room.roomId === actionTargetRoomId) ?? null,
    [chatRooms, actionTargetRoomId]
  );
  const actionTargetMemberId =
    actionTargetRoom?.member?.memberId !== undefined
      ? Number(actionTargetRoom.member.memberId)
      : undefined;

  const { block } = useBlockUser(blockTarget?.memberId ?? actionTargetMemberId);

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
    setActionTargetRoomId(roomId);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setActionTargetRoomId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (actionTargetRoomId === null) return;

    // 슬라이드 아웃 애니메이션은 API 응답과 무관하게 먼저 재생한다 — 낙관적 업데이트.
    // 실제 삭제 요청은 애니메이션이 끝나 목록에서 제거된 뒤 handleChatRoomExited에서 보낸다.
    setExitingRoomId(actionTargetRoomId);
    setActionTargetRoomId(null);
  }, [actionTargetRoomId]);

  const handleBlockPress = useCallback(() => {
    if (actionTargetRoom === null || actionTargetMemberId === undefined) return;
    setBlockTarget({
      roomId: actionTargetRoom.roomId,
      nickname: actionTargetRoom.member?.nickname ?? '',
      memberId: actionTargetMemberId,
    });
    setActionTargetRoomId(null);
  }, [actionTargetRoom, actionTargetMemberId]);

  const handleCloseBlockAlert = useCallback(() => {
    setBlockTarget(null);
  }, []);

  const handleConfirmBlock = useCallback(() => {
    if (blockTarget === null) return;
    const { roomId } = blockTarget;

    block.mutate(undefined, {
      onSuccess: () => {
        setHiddenRoomIds((prev) => new Set(prev).add(roomId));
        queryClient.invalidateQueries({ queryKey: CHAT_ROOM_QUERY_KEY });
      },
      onSettled: () => {
        setBlockTarget(null);
      },
    });
  }, [blockTarget, block, queryClient]);

  const handleReportPress = useCallback(() => {
    setReportTargetMemberId(actionTargetMemberId);
    setActionTargetRoomId(null);
    setIsReportVisible(true);
  }, [actionTargetMemberId]);

  const handleCloseReport = useCallback(() => {
    setIsReportVisible(false);
  }, []);

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
        isVisible={actionTargetRoomId !== null}
        onClose={handleCloseActionSheet}
        title=""
        hasHeader={false}
        height={360}>
        <View className="mt-4 gap-3">
          <View className="overflow-hidden rounded-2xl bg-gray-50">
            <ActionSheetRow
              label="차단하기"
              disabled={block.isPending}
              onPress={handleBlockPress}
            />
          </View>
          <View className="overflow-hidden rounded-2xl bg-gray-50">
            <ActionSheetRow label="신고하기" onPress={handleReportPress} />
          </View>
          <View className="overflow-hidden rounded-2xl bg-gray-50">
            <ActionSheetRow
              label={deleteChatRoomMutation.isPending ? '나가는 중...' : '채팅방 나가기'}
              labelClassName="text-error-500"
              disabled={deleteChatRoomMutation.isPending}
              onPress={handleConfirmDelete}
            />
          </View>
          <View className="mb-3">
            <Button
              variant="neutral"
              onPress={handleCloseActionSheet}
              disabled={deleteChatRoomMutation.isPending}
              width="w-full">
              <Text className="text-gray-900">닫기</Text>
            </Button>
          </View>
        </View>
      </BottomSheetModalWrapper>

      <ReportModal
        memberId={reportTargetMemberId}
        isVisible={isReportVisible}
        onClose={handleCloseReport}
      />

      <AlertModal
        isVisible={blockTarget !== null}
        message={`${blockTarget?.nickname ?? ''}님을 차단하시겠습니까?`}
        confirmText="차단"
        destructive
        isLoading={block.isPending}
        onCancel={handleCloseBlockAlert}
        onConfirm={handleConfirmBlock}
      />
    </>
  );
}
