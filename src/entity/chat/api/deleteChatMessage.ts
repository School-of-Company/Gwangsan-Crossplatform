import { instance } from '@/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import type { MessageId } from '@/shared/types/chatType';

// 서버 계약(Gwangsan-Server#422 제안안): DELETE /api/chat/message/{message_id}
export const deleteChatMessage = async (messageId: MessageId): Promise<void> => {
  try {
    await instance.delete(`/chat/message/${messageId}`);
  } catch (error) {
    throw toAppError(error);
  }
};
