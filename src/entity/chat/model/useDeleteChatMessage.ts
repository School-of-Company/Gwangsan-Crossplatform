import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { deleteChatMessage } from '../api/deleteChatMessage';
import { isSameMessageId, removeMessageById } from '../lib/messageCache';
import { chatMessageKeys } from './chatQueryKeys';
import { chatRoomKeys } from './useChatRooms';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
import type { MessageId, RoomId } from '@/shared/types/chatType';

interface DeleteChatMessageContext {
  readonly previousMessages?: ChatMessageResponse[];
}

export const useDeleteChatMessage = (roomId: RoomId) => {
  const queryClient = useQueryClient();
  const messageKey = chatMessageKeys.room(roomId);

  const syncRoomList = (messageId: MessageId) => {
    const rooms = queryClient.getQueryData<ChatRoomListItem[]>(chatRoomKeys.list());
    const isLastMessage = rooms?.some(
      (room) => room.roomId === roomId && isSameMessageId(room.messageId, messageId)
    );
    // 마지막 메시지를 지우면 그 이전 메시지는 캐시만으로 알 수 없으므로 목록을 다시 받아온다
    if (isLastMessage) {
      queryClient.invalidateQueries({ queryKey: chatRoomKeys.list() });
    }
  };

  return useMutation<void, Error, MessageId, DeleteChatMessageContext>({
    // 서버의 404는 "아직 저장되지 않은 메시지(전송 직후)"도 뜻한다(Gwangsan-Server#424). 성공으로 보면
    // 화면에서만 사라졌다가 서버에 저장된 뒤 다시 나타나므로, 다른 실패처럼 되돌리고 서버 안내
    // ("잠시 후 다시 시도해 주세요")를 보여준다
    mutationFn: (messageId) => deleteChatMessage(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: messageKey });
      const previousMessages = queryClient.getQueryData<ChatMessageResponse[]>(messageKey);

      queryClient.setQueryData<ChatMessageResponse[]>(messageKey, (old) =>
        removeMessageById(old, messageId)
      );

      return { previousMessages };
    },
    onSuccess: (_data, messageId) => {
      syncRoomList(messageId);
    },
    onError: (error, _messageId, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKey, context.previousMessages);
      }
      Toast.show({
        type: 'error',
        text1: '메시지를 삭제하지 못했어요',
        text2: error.message,
        visibilityTime: 3000,
      });
    },
  });
};
