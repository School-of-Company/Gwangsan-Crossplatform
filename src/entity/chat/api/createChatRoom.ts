import { instance } from '@/shared/lib/axios';
import type { CreateChatRoomResponse, ChatApiError } from '../model/chatTypes';
import type { ProductId } from '@/shared/types/chatType';
import { toAppError } from '~/shared/lib/errorHandler';

export const createChatRoom = async (productId: ProductId): Promise<CreateChatRoomResponse> => {
  try {
    const response = await instance.post(`/chat/room/${productId}`);
    return { roomId: response.data.roomId };
  } catch (e) {
    // 사용자 안내(토스트)는 호출한 쪽(UI 계층)에서 한다. API 안에서 띄우면 훅의 onError 토스트와
    // 겹치거나, 백그라운드 호출(읽음 처리 등)에서도 토스트가 떠 중복된다(#739)
    throw toAppError(e as ChatApiError);
  }
};
