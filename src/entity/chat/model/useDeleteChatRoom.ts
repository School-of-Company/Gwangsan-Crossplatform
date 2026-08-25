import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { deleteChatRoom } from '../api/deleteChatRoom';
import { chatRoomKeys } from './useChatRooms';
import type { ChatRoomListItem } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';

export const useDeleteChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: RoomId) => deleteChatRoom(roomId),
    onSuccess: (_data, roomId) => {
      queryClient.setQueryData<ChatRoomListItem[]>(chatRoomKeys.list(), (oldData) =>
        oldData?.filter((room) => room.roomId !== roomId)
      );

      Toast.show({
        type: 'success',
        text1: '채팅방이 삭제되었습니다.',
        visibilityTime: 2000,
      });
    },
  });
};
