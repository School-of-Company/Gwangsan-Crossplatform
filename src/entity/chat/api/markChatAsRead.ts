import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import type { RoomId, MessageId } from '@/shared/types/chatType';
import type { ChatApiError } from '../model/chatTypes';

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
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: '읽음 처리 실패',
      text2: error.message,
      visibilityTime: 3000,
    });

    throw error;
  }
};
