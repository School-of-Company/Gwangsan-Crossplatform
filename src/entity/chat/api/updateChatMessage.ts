import { instance } from '@/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import type { MessageId } from '@/shared/types/chatType';
import type { ChatMessageResponse } from '../model/chatTypes';

export interface UpdateChatMessageRequest {
  readonly content: string;
}

// 서버 계약(Gwangsan-Server#422 제안안): PATCH /api/chat/message/{message_id}
// 응답 본문은 확정 전이라, 수정된 메시지를 돌려주지 않아도 호출하는 쪽에서 로컬 값으로 반영한다
export const updateChatMessage = async (
  messageId: MessageId,
  content: string
): Promise<Partial<ChatMessageResponse> | undefined> => {
  try {
    const { data } = await instance.patch<Partial<ChatMessageResponse> | undefined>(
      `/chat/message/${messageId}`,
      { content } satisfies UpdateChatMessageRequest
    );
    return data || undefined;
  } catch (error) {
    // 호출하는 쪽이 상태 코드(404 등)로 분기할 수 있도록 원래 에러 객체를 유지한다
    throw toAppError(error);
  }
};
