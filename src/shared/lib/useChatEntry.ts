import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { AxiosError } from 'axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { findChatRoom, createChatRoom, getChatRooms, chatRoomKeys } from '@/entity/chat';
import type { RoomId, ProductId } from '@/shared/types/chatType';

const isNotFoundError = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 404;

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
      } catch (error) {
        // 채팅방이 아직 없으면(404) 새로 만든다. 예전에는 서버 문구("해당하는 채팅방을 찾을 수
        // 없습니다.")로 판단해, 문구가 바뀌면 채팅방을 만들지 못했다(#739)
        if (isNotFoundError(error)) {
          try {
            const newRoom = await createChatRoom(productId);
            await navigateToRoom(newRoom.roomId);
          } catch (createError) {
            Toast.show({ type: 'error', text1: getErrorMessage(createError) });
          }
        } else {
          Toast.show({ type: 'error', text1: getErrorMessage(error) });
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
      } catch (error) {
        // API는 토스트를 띄우지 않으므로 여기서 안내한다(#739)
        Toast.show({
          type: 'error',
          text1: '채팅방에 들어가지 못했어요',
          text2: getErrorMessage(error),
        });
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
