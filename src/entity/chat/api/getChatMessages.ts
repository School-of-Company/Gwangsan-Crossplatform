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
import type { ChatMessagePageCursor } from '../lib/messageCache';

// 서버(Gwangsan-Server ChatController) 기본값이 20이고 최댓값 제한은 없다. 페이지마다 같은 크기를
// 명시해 보내야 "받은 개수 < limit"으로 마지막 페이지를 판단할 수 있다
export const CHAT_MESSAGE_PAGE_SIZE = 30;

interface GetChatRoomDataOptions {
  // 서버는 (createdAt, messageId) 기준 내림차순으로 이 커서보다 오래된 메시지를 돌려준다.
  // createdAt은 REST가 내려준 문자열(LocalDateTime, 시간대 없음)을 그대로 돌려줘야 한다
  readonly cursor?: ChatMessagePageCursor | null;
  readonly limit?: number;
}

interface ChatRoomApiResponse {
  readonly product?: TradeProduct;
  readonly messages?: readonly ChatMessageResponse[];
}

export const getChatRoomData = async (
  roomId: RoomId,
  { cursor = null, limit = CHAT_MESSAGE_PAGE_SIZE }: GetChatRoomDataOptions = {}
): Promise<ChatRoomWithProduct> => {
  try {
    const response = await instance.get(`/chat/${roomId}`, {
      params: cursor
        ? { lastCreatedAt: cursor.lastCreatedAt, lastMessageId: cursor.lastMessageId, limit }
        : { limit },
    });

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

    // isMine은 서버가 발신자 기준으로 계산한 값을 그대로 쓴다(로컬 세션으로 재계산하면 캐시 타이밍에 따라 뒤집힌다)
    return { product, messages };
  } catch (e) {
    // 토스트는 호출한 UI 쪽에서 띄운다(백그라운드 호출에서도 뜨거나 중복되지 않게)
    throw toAppError(e as ChatApiError);
  }
};

export const getChatMessages = async (roomId: RoomId): Promise<ChatMessageResponse[]> => {
  const data = await getChatRoomData(roomId);
  return [...data.messages];
};
