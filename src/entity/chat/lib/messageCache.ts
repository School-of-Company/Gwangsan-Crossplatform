import type { MessageId, RoomId } from '@/shared/types/chatType';
import type { ChatMessageResponse } from '../model/chatTypes';

export interface MessageUpdatedPayload {
  readonly roomId: RoomId;
  readonly messageId: MessageId;
  readonly content: string;
  readonly editedAt: string;
}

export interface MessageDeletedPayload {
  readonly roomId: RoomId;
  readonly messageId: MessageId;
}

// 서버·소켓에 따라 messageId가 숫자/문자열로 섞여 올 수 있어 문자열로 비교한다
export const isSameMessageId = (a: MessageId, b: MessageId) => String(a) === String(b);

export const applyMessageUpdate = (
  messages: readonly ChatMessageResponse[] | undefined,
  update: Pick<MessageUpdatedPayload, 'messageId' | 'content' | 'editedAt'>
): ChatMessageResponse[] | undefined => {
  if (!messages) return messages;

  let changed = false;
  const next = messages.map((message) => {
    if (!isSameMessageId(message.messageId, update.messageId)) return message;
    changed = true;
    return { ...message, content: update.content, editedAt: update.editedAt };
  });

  return changed ? next : (messages as ChatMessageResponse[]);
};

export const removeMessageById = (
  messages: readonly ChatMessageResponse[] | undefined,
  messageId: MessageId
): ChatMessageResponse[] | undefined => {
  if (!messages) return messages;

  const next = messages.filter((message) => !isSameMessageId(message.messageId, messageId));
  return next.length === messages.length ? (messages as ChatMessageResponse[]) : next;
};
