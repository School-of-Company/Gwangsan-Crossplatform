import { instance } from '~/shared/lib/axios';
import type { RoomId, MessageId } from '~/shared/types/chatType';
import type { ChatApiError } from '../model/chatTypes';
import { toAppError } from '~/shared/lib/errorHandler';

interface MarkChatAsReadRequest {
  roomId: RoomId;
  lastMessageId: MessageId;
}

export const markChatAsRead = async (roomId: RoomId, lastMessageId: MessageId): Promise<void> => {
  try {
    const requestBody: MarkChatAsReadRequest = {
      roomId,
      lastMessageId,
    };

    await instance.patch('/chat/read', requestBody);
  } catch (e) {
    // 토스트는 호출한 쪽(UI 계층)에서 띄운다. 여기서 띄우면 훅의 onError 토스트와 겹치고
    // 백그라운드 호출(읽음 처리 등)에서도 토스트가 뜬다
    throw toAppError(e as ChatApiError);
  }
};
