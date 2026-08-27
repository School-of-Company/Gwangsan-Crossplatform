import { useQuery } from '@tanstack/react-query';
import { getChatRoomData } from '../api/getChatMessages';
import type { RoomId } from '~/shared/types/chatType';
import type { ChatApiError, ChatRoomWithProduct } from './chatTypes';

interface UseChatRoomDataOptions {
  readonly roomId: RoomId;
  readonly enabled?: boolean;
}

export const useChatRoomData = ({ roomId, enabled = true }: UseChatRoomDataOptions) => {
  return useQuery<ChatRoomWithProduct>({
    queryKey: ['chatRoomData', roomId],
    queryFn: () => getChatRoomData(roomId),
    enabled: enabled && !!roomId,
    staleTime: 30 * 1000,
    // 채팅방이 삭제(나가기)되어 404가 나면 다시 살아나지 않으므로 폴링을 멈춘다.
    // 계속 재시도하면 화면을 나가기 전까지 30초마다 같은 에러가 Sentry로 올라간다.
    refetchInterval: (query) =>
      (query.state.error as ChatApiError | null)?.status === 404 ? false : 30 * 1000,
    refetchOnWindowFocus: false,
  });
};
