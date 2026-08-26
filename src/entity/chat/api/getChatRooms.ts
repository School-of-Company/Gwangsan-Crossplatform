import { instance } from '@/shared/lib/axios';
import type { ChatRoomListItem, ChatApiError } from '../model/chatTypes';
import { toAppError } from '~/shared/lib/errorHandler';

export const getChatRooms = async (): Promise<ChatRoomListItem[]> => {
  try {
    const response = await instance.get('/chat/rooms');
    return response.data;
  } catch (e) {
    // 30초마다 폴링하므로 토스트를 띄우면 실패가 이어질 때 계속 쌓인다.
    // 실패 표시는 목록 화면의 에러 상태가 담당한다.
    throw toAppError(e as ChatApiError);
  }
};
