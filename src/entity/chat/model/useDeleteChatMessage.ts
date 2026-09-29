import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { AxiosError } from 'axios';
import { deleteChatMessage } from '../api/deleteChatMessage';
import { isSameMessageId, removeMessageById } from '../lib/messageCache';
import { chatMessageKeys } from './chatQueryKeys';
import { chatRoomKeys } from './useChatRooms';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
import type { MessageId, RoomId } from '@/shared/types/chatType';

interface DeleteChatMessageContext {
  readonly previousMessages?: ChatMessageResponse[];
}

// 이미 지워진 메시지(다른 기기에서 먼저 삭제 등)는 404가 오는데, 사용자가 원하는 결과는
// 같으므로 실패로 되돌리지 않는다
const isAlreadyDeletedError = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 404;

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
    mutationFn: async (messageId) => {
      try {
        await deleteChatMessage(messageId);
      } catch (error) {
        if (isAlreadyDeletedError(error)) return;
        throw error;
      }
    },
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
