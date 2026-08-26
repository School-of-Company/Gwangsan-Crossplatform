import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import type { ChatApiError } from '../model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';
import { toAppError } from '~/shared/lib/errorHandler';

export const deleteChatRoom = async (roomId: RoomId): Promise<void> => {
  try {
    await instance.delete(`/chat/room/${roomId}`);
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: '채팅방 삭제 실패',
      text2: error.message,
      visibilityTime: 3000,
    });

    throw toAppError(error);
  }
};
