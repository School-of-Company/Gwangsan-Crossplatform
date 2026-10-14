import { MESSAGE_TYPE } from '@/shared/types/chatType';
import { MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { EnhancedChatMessage } from '../model/useChatMessages';

export const isSystemMessage = (message: { readonly messageType: string }): boolean =>
  message.messageType === MESSAGE_TYPE.SYSTEM;

// 보낸 지 24시간이 지난 메시지는 수정/삭제할 수 없다. 서버는 정확히 24시간인 시점까지 허용한다
// (Gwangsan-Server#424)
export const MESSAGE_MODIFY_WINDOW_MS = 24 * 60 * 60 * 1000;

// 내가 보냈고, 서버에 저장이 끝났고(전송 중·실패한 임시 메시지 제외), 보낸 지 24시간 이내인
// 메시지만 수정/삭제 메뉴를 띄운다
export const canModifyMessage = (
  message: EnhancedChatMessage,
  now: number = Date.now()
): boolean => {
  if (!message.isMine) return false;
  if (isSystemMessage(message)) return false;
  if (message.tempId) return false;
  if (message.status && message.status !== MESSAGE_STATUS.SENT) return false;

  const createdAt = new Date(message.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return false;

  return now - createdAt <= MESSAGE_MODIFY_WINDOW_MS;
};

// 이미지 메시지는 삭제만 할 수 있다
export const canEditMessage = (message: EnhancedChatMessage, now: number = Date.now()): boolean =>
  canModifyMessage(message, now) && message.messageType === MESSAGE_TYPE.TEXT;
