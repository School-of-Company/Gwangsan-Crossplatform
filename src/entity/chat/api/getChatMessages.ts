import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import type {
  ChatMessageResponse,
  ChatApiError,
  ChatRoomWithProduct,
  TradeProduct,
} from '../model/chatTypes';
import { isTradeProduct } from '../model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';
import { toAppError } from '~/shared/lib/errorHandler';

interface ChatRoomApiResponse {
  readonly product?: TradeProduct;
  readonly messages?: readonly ChatMessageResponse[];
}

export const getChatRoomData = async (roomId: RoomId): Promise<ChatRoomWithProduct> => {
  try {
    const response = await instance.get(`/chat/${roomId}`);

    let messages: readonly ChatMessageResponse[] = [];
    let product: TradeProduct | null = null;

    if (Array.isArray(response.data)) {
      messages = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const { product: serverProduct, messages: serverMessages } =
        response.data as ChatRoomApiResponse;
      messages = Array.isArray(serverMessages) ? serverMessages : [];
      product = serverProduct && isTradeProduct(serverProduct) ? serverProduct : null;
    }

    // 서버가 이미 발신자 기준으로 정확한 isMine을 계산해서 보내므로, 로컬 세션 캐시
    // (getCurrentUserId)와 senderId를 다시 비교해 재계산하지 않는다 — 그 재계산 과정의
    // 캐시 타이밍 경합이 본인 메시지를 상대방 메시지로 뒤집어 보이게 하는 원인이었다(#619).
    return { product, messages };
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: error?.message || '채팅방 데이터를 불러올 수 없습니다',
    });

    throw toAppError(error);
  }
};

export const getChatMessages = async (roomId: RoomId): Promise<ChatMessageResponse[]> => {
  const data = await getChatRoomData(roomId);
  return [...data.messages];
};
