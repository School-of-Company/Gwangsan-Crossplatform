import { useQuery } from '@tanstack/react-query';
import { getChatRoomData } from '../api/getChatMessages';
import type { RoomId } from '~/shared/types/chatType';
import type { ChatRoomWithProduct } from './chatTypes';

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
    refetchOnWindowFocus: false,
  });
};
