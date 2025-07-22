import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import type { ChatMessageResponse, ChatApiError } from '../model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';

export const getChatMessages = async (roomId: RoomId): Promise<ChatMessageResponse[]> => {
  try {
    const [response, userId] = await Promise.all([
      instance.get(`/chat/${roomId}`),
      getCurrentUserId(),
    ]);

    const correctedMessages = response.data.map((msg: any) => ({
      ...msg,
      isMine: msg.senderId === userId,
    }));

    return correctedMessages;
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: error.message,
    });

    throw error;
  }
};
