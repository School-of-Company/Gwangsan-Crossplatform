import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import type { ChatRoomListItem, ChatApiError } from '../model/chatTypes';

export const getChatRooms = async (): Promise<ChatRoomListItem[]> => {
  try {
    const response = await instance.get('/chat/rooms');
    return response.data;
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: '채팅방 목록 조회 실패',
      text2: error.message,
      visibilityTime: 3000,
    });

    throw error;
  }
};
