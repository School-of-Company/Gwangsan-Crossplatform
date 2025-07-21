import Toast from 'react-native-toast-message';
import { instance } from '../../../shared/lib/axios';
import {
  transformRoomIdResponse,
} from '../lib/chatApiTransformer';
import type { FindChatRoomResponse, ChatApiError } from '../model/chatTypes';
import type { ProductId } from '../../../shared/types/chatType';

export const findChatRoom = async (productId: ProductId): Promise<FindChatRoomResponse> => {
  try {
    const response = await instance.get(`/chat/room/${productId}`);
    return transformRoomIdResponse(response.data, 'findChatRoom') as FindChatRoomResponse;
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: '채팅방 조회 실패',
      text2: error.message,
      visibilityTime: 3000,
    });

    throw error;
  }
};
