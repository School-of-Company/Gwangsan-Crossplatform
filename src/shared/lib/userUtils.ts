import type { ChatMessageResponse } from '~/entity/chat/model/chatTypes';
import { getData } from './getData';

export const extractOtherUserInfo = (messages: readonly ChatMessageResponse[]) => {
  const otherUser = messages.find((msg) => !msg.isMine);

  return {
    nickname: otherUser?.senderNickname || '상대방',
    id: otherUser?.senderId,
  };
};

export const checkIsMyPost = async (authorId: string | number): Promise<boolean> => {
  try {
    const memberId = await getData('memberId');
    const currentUserId = Number(memberId);
    return currentUserId === Number(authorId) && currentUserId !== 0;
  } catch {
    return false;
  }
};

export const ensureMessagesArray = (messages: unknown): ChatMessageResponse[] => {
  return Array.isArray(messages) ? messages : [];
};
