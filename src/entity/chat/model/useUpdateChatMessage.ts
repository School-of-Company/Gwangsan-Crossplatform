import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { updateChatMessage } from '../api/updateChatMessage';
import { applyMessageUpdate, isSameMessageId } from '../lib/messageCache';
import { chatMessageKeys } from './chatQueryKeys';
import { chatRoomKeys } from './useChatRooms';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
import type { MessageId, RoomId } from '@/shared/types/chatType';

interface UpdateChatMessageVariables {
  readonly messageId: MessageId;
  readonly content: string;
}

interface UpdateChatMessageContext {
  readonly previousMessages?: ChatMessageResponse[];
}

export const useUpdateChatMessage = (roomId: RoomId) => {
  const queryClient = useQueryClient();
  const messageKey = chatMessageKeys.room(roomId);

  return useMutation<
    Partial<ChatMessageResponse> | undefined,
    Error,
    UpdateChatMessageVariables,
    UpdateChatMessageContext
  >({
    mutationFn: ({ messageId, content }) => updateChatMessage(messageId, content),
    // 수정한 내용을 바로 보여주고, 실패하면 이전 상태로 되돌린다
    onMutate: async ({ messageId, content }) => {
      await queryClient.cancelQueries({ queryKey: messageKey });
      const previousMessages = queryClient.getQueryData<ChatMessageResponse[]>(messageKey);

      queryClient.setQueryData<ChatMessageResponse[]>(messageKey, (old) =>
        applyMessageUpdate(old, { messageId, content, editedAt: new Date().toISOString() })
      );

      return { previousMessages };
    },
    onSuccess: (updated, { messageId, content }) => {
      if (updated?.editedAt) {
        queryClient.setQueryData<ChatMessageResponse[]>(messageKey, (old) =>
          applyMessageUpdate(old, {
            messageId,
            content: updated.content ?? content,
            editedAt: updated.editedAt as string,
          })
        );
      }

      // 수정한 메시지가 채팅방 목록의 마지막 메시지면 목록 미리보기도 바꾼다
      queryClient.setQueryData<ChatRoomListItem[]>(chatRoomKeys.list(), (old) =>
        old?.map((room) =>
          room.roomId === roomId && isSameMessageId(room.messageId, messageId)
            ? { ...room, lastMessage: updated?.content ?? content }
            : room
        )
      );
    },
    onError: (error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKey, context.previousMessages);
      }
      Toast.show({
        type: 'error',
        text1: '메시지를 수정하지 못했어요',
        text2: error.message,
        visibilityTime: 3000,
      });
    },
  });
};
