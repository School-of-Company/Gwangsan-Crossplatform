import { instance } from '@/shared/lib/axios';
import type { FindChatRoomResponse, ChatApiError } from '../model/chatTypes';
import type { ProductId } from '@/shared/types/chatType';

export const findChatRoom = async (productId: ProductId): Promise<FindChatRoomResponse> => {
  try {
    const response = await instance.get(`/chat/room/${productId}`);
    return { roomId: response.data.roomId };
  } catch (e) {
    const error = e as ChatApiError;

    throw error;
  }
};
