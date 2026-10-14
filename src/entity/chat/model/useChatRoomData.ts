import { useQuery } from '@tanstack/react-query';
import { getChatRoomData } from '../api/getChatMessages';
import type { RoomId } from '~/shared/types/chatType';
import type { ChatApiError, ChatRoomWithProduct } from './chatTypes';
import { chatRoomDataKeys } from './chatQueryKeys';

export const CHAT_ROOM_DATA_POLL_INTERVAL = 30 * 1000;

interface UseChatRoomDataOptions {
  readonly roomId: RoomId;
  readonly enabled?: boolean;
  // 소켓이 연결돼 있으면 새 메시지(receiveMessage)와 거래 상태(transactionStateChanged)가 실시간으로
  // 들어오고, 재연결 시에도 다시 조회하므로 폴링이 필요 없다. 이 응답에는 메시지 전체 이력이 담겨 있어
  // 대화가 길수록 폴링 한 번의 비용이 커진다(#731)
  readonly pausePolling?: boolean;
}

export const getChatRoomDataRefetchInterval = (
  error: ChatApiError | null,
  pausePolling: boolean
): number | false => {
  if (pausePolling) return false;
  // 채팅방이 삭제(나가기)되어 404가 나면 다시 살아나지 않으므로 폴링을 멈춘다.
  // 계속 재시도하면 화면을 나가기 전까지 30초마다 같은 에러가 Sentry로 올라간다.
  if (error?.status === 404) return false;
  return CHAT_ROOM_DATA_POLL_INTERVAL;
};

export const useChatRoomData = ({
  roomId,
  enabled = true,
  pausePolling = false,
}: UseChatRoomDataOptions) => {
  return useQuery<ChatRoomWithProduct>({
    queryKey: chatRoomDataKeys.room(roomId),
    queryFn: () => getChatRoomData(roomId),
    enabled: enabled && !!roomId,
    staleTime: 30 * 1000,
    refetchInterval: (query) =>
      getChatRoomDataRefetchInterval(query.state.error as ChatApiError | null, pausePolling),
    refetchOnWindowFocus: false,
  });
};
