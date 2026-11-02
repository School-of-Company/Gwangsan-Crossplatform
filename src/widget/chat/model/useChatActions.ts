import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { ChatMessageResponse } from '~/entity/chat';

interface UseChatActionParams {
  readonly otherUserInfo: { nickname: string; id?: number };
}

interface UseChatActionReturn {
  readonly navigationHandlers: {
    readonly goToProfile: (userId: number) => void;
    readonly goToOtherUserProfile: () => void;
  };
  readonly formatLastMessageDate: (messages: readonly ChatMessageResponse[]) => string;
}

export const useChatAction = ({ otherUserInfo }: UseChatActionParams): UseChatActionReturn => {
  const router = useRouter();

  const goToProfile = useCallback(
    (userId: number) => {
      router.push(`/profile?id=${userId}`);
    },
    [router]
  );

  const goToOtherUserProfile = useCallback(() => {
    if (otherUserInfo.id) {
      goToProfile(otherUserInfo.id);
    }
  }, [otherUserInfo.id, goToProfile]);

  const navigationHandlers = { goToProfile, goToOtherUserProfile };

  const formatLastMessageDate = useCallback((messages: readonly ChatMessageResponse[]) => {
    if (messages.length === 0) return '대화를 시작해보세요';

    const lastMessage = messages[messages.length - 1];
    return new Date(lastMessage.createdAt).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  return {
    navigationHandlers,
    formatLastMessageDate,
  };
};
