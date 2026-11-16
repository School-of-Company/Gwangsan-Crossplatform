import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatRoomDataKeys } from './chatQueryKeys';
import type { ChatRoomWithProduct, TradeProduct } from './chatTypes';
import type { RoomId } from '~/shared/types/chatType';

// 거래·예약 변경 직후 채팅방 캐시의 product만 먼저 고쳐, 재조회 전에도 화면이 바로 바뀌게 한다
export const usePatchChatRoomProduct = (roomId: RoomId) => {
  const queryClient = useQueryClient();

  return useCallback(
    (patch: Partial<TradeProduct>) => {
      queryClient.setQueryData<ChatRoomWithProduct>(chatRoomDataKeys.room(roomId), (old) =>
        old?.product ? { ...old, product: { ...old.product, ...patch } } : old
      );
    },
    [queryClient, roomId]
  );
};
