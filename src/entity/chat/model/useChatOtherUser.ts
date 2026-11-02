import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { extractOtherUserInfo } from '~/shared/lib/userUtils';
import type { RoomId } from '~/shared/types/chatType';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
import { chatRoomKeys } from './chatQueryKeys';

export interface ChatOtherUserInfo {
  readonly nickname: string;
  readonly id?: number;
}

const EMPTY_MESSAGES: readonly ChatMessageResponse[] = [];

export const selectChatOtherUser = (
  rooms: readonly ChatRoomListItem[] | undefined,
  roomId: RoomId,
  messages: readonly ChatMessageResponse[]
): ChatOtherUserInfo => {
  const currentRoom = rooms?.find((room) => room.roomId === roomId);
  if (currentRoom?.member) {
    return {
      nickname: currentRoom.member.nickname,
      id: Number(currentRoom.member.memberId),
    };
  }
  return extractOtherUserInfo(messages);
};

// 채팅 상대 정보만 필요할 때 쓰는 셀렉터. 채팅 목록 캐시에 방이 있으면 그 멤버 정보를,
// 없으면(목록을 거치지 않고 진입) 메시지 중 상대가 보낸 첫 메시지에서 꺼낸다.
// 소켓·메시지 조회를 새로 구동하지 않고 이미 받은 캐시만 읽는다.
export const useChatOtherUser = (
  roomId: RoomId,
  messages: readonly ChatMessageResponse[] | undefined
): ChatOtherUserInfo => {
  const queryClient = useQueryClient();
  const safeMessages = messages ?? EMPTY_MESSAGES;

  return useMemo(
    () =>
      selectChatOtherUser(
        queryClient.getQueryData<ChatRoomListItem[]>(chatRoomKeys.list()),
        roomId,
        safeMessages
      ),
    [queryClient, roomId, safeMessages]
  );
};
