import { useCallback } from 'react';
import { useRouter } from 'expo-router';

interface UpdateProfileRequestseChatActionParams {
  readonly otherUserInfo: { nickname: string; id?: number };
}

interface UseChatActionReturn {
  readonly navigationHandlers: {
    readonly goToProfile: (userId: number) => void;
    readonly goToOtherUserProfile: () => void;
  };
  readonly formatLastMessageDate: (messages: any[]) => string;
}

export const useChatAction = ({
  otherUserInfo,
}: UpdateProfileRequestseChatActionParams): UseChatActionReturn => {
  const router = useRouter();

  const navigationHandlers = {
    goToProfile: useCallback(() => {
      router.push('/profile');
    }, [router]),

    goToOtherUserProfile: useCallback(() => {
      if (otherUserInfo.id) {
        router.push(`/profile?id=${otherUserInfo.id}`);
      }
    }, [otherUserInfo.id, router]),
  };

  const formatLastMessageDate = useCallback((messages: any[]) => {
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
