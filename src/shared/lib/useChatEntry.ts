import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { findChatRoom, createChatRoom, getChatRooms, chatRoomKeys } from '@/entity/chat';
import type { RoomId, ProductId } from '@/shared/types/chatType';

export const useChatEntry = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToRoom = useCallback(
    async (roomId: RoomId) => {
      // 목록 캐시(chatRoomKeys.list())를 미리 채워야 채팅방 화면이 상대방 정보를
      // 정확히 표시한다. 채팅목록 화면을 거치지 않고 들어오는 진입 경로라
      // 캐시가 비어 있으면 메시지 기반 추정으로 폴백해 상대방 정보가 틀어진다.
      try {
        await queryClient.fetchQuery({
          queryKey: chatRoomKeys.list(),
          queryFn: getChatRooms,
          staleTime: 0,
        });
      } catch {}

      router.push(`/chatting/${roomId}`);
    },
    [router, queryClient]
  );

  const navigateToChat = useCallback(
    async (productId: ProductId) => {
      setIsLoading(true);

      try {
        const room = await findChatRoom(productId);
        await navigateToRoom(room.roomId);
      } catch (error: any) {
        if (error.message === '해당하는 채팅방을 찾을 수 없습니다.') {
          try {
            const newRoom = await createChatRoom(productId);
            await navigateToRoom(newRoom.roomId);
          } catch (error: any) {
            Toast.show({
              type: 'error',
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
    [navigateToRoom]
  );

  // 상품의 '채팅하기'로만 호출되는 명시적 재참여 경로. 나간 방이어도 GET으로 찾아 들어가면
  // 숨김이 풀리지 않으므로, 항상 POST로 기존 방을 재사용해 요청자의 숨김을 해제한다.
  // 과거 알림 클릭·거래신청 roomId 직행 같은 경로는 이 함수 대신 navigateToChat/navigateToRoom을
  // 그대로 써서 자동 재참여로 취급되지 않게 한다.
  const rejoinChat = useCallback(
    async (productId: ProductId) => {
      setIsLoading(true);

      try {
        const room = await createChatRoom(productId);
        await navigateToRoom(room.roomId);
      } catch {
        // createChatRoom이 실패 시 이미 에러 Toast를 띄운다
      } finally {
        setIsLoading(false);
      }
    },
    [navigateToRoom]
  );

  return {
    navigateToChat,
    navigateToRoom,
    rejoinChat,
    isLoading,
  };
};
