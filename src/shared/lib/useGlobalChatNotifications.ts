import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { chatSocket } from './socket';
import { getData } from './getData';
import { getCurrentUserId } from './getCurrentUserId';
import { getChatRooms, chatRoomKeys } from '@/entity/chat';
import type { ChatMessageResponse } from '@/entity/chat/model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';

// 나간 방은 GET /chat/rooms 목록에서 제외되므로, 그 목록에 없다는 사실 자체가 "나감" 신호다.
// staleTime을 0으로 둬 항상 최신 상태를 확인한다 — 비어있거나 오래된 캐시로 나감 여부를 판정하면
// 안 되기 때문이다(#609). 조회에 실패하면 나감 여부를 알 수 없으니 알림은 그대로 띄운다(안전한 기본값).
const isRoomHidden = async (
  queryClient: ReturnType<typeof useQueryClient>,
  roomId: RoomId
): Promise<boolean> => {
  try {
    const rooms = await queryClient.fetchQuery({
      queryKey: chatRoomKeys.list(),
      queryFn: getChatRooms,
      staleTime: 0,
    });
    return !rooms.some((room) => room.roomId === roomId);
  } catch {
    return false;
  }
};

export const useGlobalChatNotifications = () => {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const queryClient = useQueryClient();

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // 앱 시작 시점에는 로그인 전이라 accessToken이 없어 연결이 실패하므로,
  // 화면 이동 시마다 재시도해야 로그인 이후에도 전역 알림이 동작한다.
  // (이미 연결됐거나 연결 중이면 connect()가 즉시 반환되므로 비용 없음)
  useEffect(() => {
    let isMounted = true;

    if (!chatSocket.isConnected) {
      getData('accessToken').then((accessToken) => {
        if (isMounted && accessToken && !chatSocket.isConnected) {
          chatSocket.connect().catch(() => {});
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      // 포그라운드로 돌아오면 앱 뱃지를 초기화하고 필요 시 소켓을 재연결한다.
      Notifications.setBadgeCountAsync(0).catch(() => {});
      if (!chatSocket.isConnected) {
        getData('accessToken').then((accessToken) => {
          if (accessToken && !chatSocket.isConnected) {
            chatSocket.connect().catch(() => {});
          }
        });
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const handleReceiveMessage = async (message: ChatMessageResponse) => {
      const userId = await getCurrentUserId().catch(() => null);
      if (!userId || message.senderId === userId) return;

      if (pathnameRef.current === `/chatting/${message.roomId}`) return;

      if (await isRoomHidden(queryClient, message.roomId)) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.senderNickname,
          body: message.messageType === 'IMAGE' ? '사진을 보냈습니다.' : (message.content ?? ''),
          data: { roomId: message.roomId },
        },
        trigger: null,
      });
    };

    chatSocket.on<ChatMessageResponse>('receiveMessage', handleReceiveMessage);
    return () => chatSocket.off<ChatMessageResponse>('receiveMessage', handleReceiveMessage);
  }, [queryClient]);
};
