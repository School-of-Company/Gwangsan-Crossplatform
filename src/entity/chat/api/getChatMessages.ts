import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import type { 
  ChatMessageResponse, 
  ChatApiError, 
  ChatRoomWithProduct,
  TradeProduct,
} from '../model/chatTypes';
import { isTradeProduct } from '../model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';

interface ChatRoomApiResponse {
  readonly product?: TradeProduct;
  readonly messages?: readonly ChatMessageResponse[];
}

export const getChatRoomData = async (roomId: RoomId): Promise<ChatRoomWithProduct> => {
  try {
    const [response, userId] = await Promise.all([
      instance.get(`/chat/${roomId}`),
      getCurrentUserId(),
    ]);

    let messages: readonly ChatMessageResponse[] = [];
    let product: TradeProduct | null = null;

    if (Array.isArray(response.data)) {
      messages = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const { product: serverProduct, messages: serverMessages } = response.data as ChatRoomApiResponse;
      messages = Array.isArray(serverMessages) ? serverMessages : [];
      product = serverProduct && isTradeProduct(serverProduct) ? serverProduct : null;
    }

    const correctedMessages = messages.map((msg) => ({
      ...msg,
      isMine: msg.senderId === userId,
    })) as ChatMessageResponse[];

    return {
      product,
      messages: correctedMessages,
    };
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: error?.message || '채팅방 데이터를 불러올 수 없습니다',
    });

    throw error;
  }
};

export const getChatMessages = async (roomId: RoomId): Promise<ChatMessageResponse[]> => {
  try {
    const data = await getChatRoomData(roomId);
    return Array.isArray(data.messages) ? [...data.messages] : [];
  } catch (error) {
    console.error('getChatMessages error:', error);
    return [];
  }
};
