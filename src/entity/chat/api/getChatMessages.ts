import Toast from 'react-native-toast-message';
import { instance } from '@/shared/lib/axios';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import type { ChatMessageResponse, ChatApiError } from '../model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';

export const getChatMessages = async (roomId: RoomId): Promise<ChatMessageResponse[]> => {
  try {
    const [response, userId] = await Promise.all([
      instance.get(`/chat/${roomId}`),
      getCurrentUserId()
    ]);

    console.log('Chat messages API response:', {
      roomId,
      currentUserId: userId,
      messagesCount: response.data.length,
      messages: response.data.map((msg: any) => ({
        messageId: msg.messageId,
        isMine: msg.isMine,
        senderNickname: msg.senderNickname,
        senderId: msg.senderId,
        content: msg.content
      }))
    });

    const correctedMessages = response.data.map((msg: any) => ({
      ...msg,
      isMine: msg.senderId === userId
    }));

    console.log('Corrected messages:', correctedMessages.map((msg: any) => ({
      messageId: msg.messageId,
      isMine: msg.isMine,
      senderNickname: msg.senderNickname,
      senderId: msg.senderId,
      content: msg.content
    })));

    return correctedMessages;
  } catch (e) {
    const error = e as ChatApiError;

    Toast.show({
      type: 'error',
      text1: '채팅 메시지 조회 실패',
      text2: error.message,
      visibilityTime: 3000,
    });

    throw error;
  }
};
