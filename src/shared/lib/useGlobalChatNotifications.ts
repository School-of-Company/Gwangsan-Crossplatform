import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { chatSocket } from './socket';
import { getCurrentUserId } from './getCurrentUserId';
import type { ChatMessageResponse } from '@/entity/chat/model/chatTypes';

export const useGlobalChatNotifications = () => {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // 앱 시작 시점에는 로그인 전이라 accessToken이 없어 연결이 실패하므로,
  // 화면 이동 시마다 재시도해야 로그인 이후에도 전역 알림이 동작한다.
  // (이미 연결됐거나 연결 중이면 connect()가 즉시 반환되므로 비용 없음)
  useEffect(() => {
    if (!chatSocket.isConnected) {
      chatSocket.connect().catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      // 포그라운드로 돌아오면 앱 뱃지를 초기화하고 필요 시 소켓을 재연결한다.
      Notifications.setBadgeCountAsync(0).catch(() => {});
      if (!chatSocket.isConnected) {
        chatSocket.connect().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const handleReceiveMessage = async (message: ChatMessageResponse) => {
      const userId = await getCurrentUserId().catch(() => null);
      if (!userId || message.senderId === userId) return;

      if (pathnameRef.current === `/chatting/${message.roomId}`) return;

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
  }, []);
};
