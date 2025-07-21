import Toast from 'react-native-toast-message';
import { instance } from '../../../shared/lib/axios';
import {
  transformChatMessagesResponse,
} from '../lib/chatApiTransformer';
import type { ChatMessageResponse, ChatApiError } from '../model/chatTypes';
import type { RoomId } from '../../../shared/types/chatType';

export const getChatMessages = async (roomId: RoomId): Promise<ChatMessageResponse[]> => {
  try {
    const response = await instance.get(`/chat/${roomId}`);
    return transformChatMessagesResponse(response.data);
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: '채팅 메시지 조회 실패',
      text2: error.message,
      visibilityTime: 3000,
    });

    throw error;
  }
};
