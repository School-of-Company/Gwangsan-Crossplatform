import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import type { CreateChatRoomResponse, ChatApiError } from '../model/chatTypes';
import type { ProductId } from '@/shared/types/chatType';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export const createChatRoom = async (productId: ProductId): Promise<CreateChatRoomResponse> => {
  try {
    const response = await instance.post(`/chat/room/${productId}`);
    return { roomId: response.data.roomId };
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: '채팅방 생성 실패',
      text2: error.message,
      visibilityTime: 3000,
    });

    throw new Error(getErrorMessage(error));
  }
};
