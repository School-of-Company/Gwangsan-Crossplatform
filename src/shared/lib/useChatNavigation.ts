import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { findChatRoom, createChatRoom } from '@/entity/chat';
import type { ProductId } from '@/shared/types/chatType';

export const useChatNavigation = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToChat = useCallback(
    async (productId: ProductId) => {
      setIsLoading(true);

      try {
        const room = await findChatRoom(productId);
        router.push(`/chatting/${room.roomId}`);
      } catch (error: any) {
        if (error?.status === 404) {
          try {
            const newRoom = await createChatRoom(productId);
            router.push(`/chatting/${newRoom.roomId}`);
          } catch (error: any) {
            Toast.show({
              type: 'create error',
              text1: error.message,
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: error.message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    navigateToChat,
    isLoading,
  };
};
