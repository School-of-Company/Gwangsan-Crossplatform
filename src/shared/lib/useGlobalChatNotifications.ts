import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!chatSocket.isConnected) {
      chatSocket.connect().catch(() => {});
    }

    const handleReceiveMessage = async (message: ChatMessageResponse) => {
      const userId = await getCurrentUserId().catch(() => null);
      if (!userId || message.senderId === userId) return;

      if (pathnameRef.current.includes(`/chatting/${message.roomId}`)) return;

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
