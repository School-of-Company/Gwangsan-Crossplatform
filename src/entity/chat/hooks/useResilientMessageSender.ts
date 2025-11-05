import { useCallback, useEffect, useRef } from 'react';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { RoomId, MessageType } from '~/shared/types/chatType';
import Toast from 'react-native-toast-message';

interface ResilientSenderProps {
  roomId: RoomId;
  isSocketConnected: boolean;
  socketSendMessage: (roomId: RoomId, content: string, type: MessageType, imageIds: number[]) => void;
}

export const useResilientMessageSender = ({
  roomId,
  isSocketConnected,
  socketSendMessage,
}: ResilientSenderProps) => {
  const wasConnectedRef = useRef<boolean>(isSocketConnected);
  
  const addMessage = useChatQueueStore((state) => state.addMessage);
  const setStatus = useChatQueueStore((state) => state.setStatus);
  const removeMessage = useChatQueueStore((state) => state.removeMessage);
  const getRetryable = useChatQueueStore((state) => state.getRetryable);
  const retry = useChatQueueStore((state) => state.retry);
  
  const attemptSend = useCallback(
    (
      tempId: string,
      content: string | null,
      messageType: MessageType,
      imageIds: number[]
    ) => {
      try {
        if (!isSocketConnected) {
          setStatus(tempId, MESSAGE_STATUS.PENDING);
          return;
        }
        
        setStatus(tempId, MESSAGE_STATUS.SENDING);
        
        socketSendMessage(
          roomId,
          content || (messageType === 'IMAGE' ? ' ' : ''),
          messageType,
          imageIds
        );
        
        setStatus(tempId, MESSAGE_STATUS.SENT);
        
        setTimeout(() => removeMessage(tempId), 2000);
        
      } catch (error) {
        console.error(error);
        setStatus(tempId, MESSAGE_STATUS.FAILED);
        Toast.show({
          type: 'error',
          text1: '메시지 전송 실패',
          text2: '다시 시도하려면 탭하세요',
          onPress: () => {
            retry(tempId);
            attemptSend(tempId, content, messageType, imageIds);
          },
          visibilityTime: 4000,
        });
      }
    },
    [isSocketConnected, socketSendMessage, roomId, setStatus, removeMessage, retry]
  );
  
  const sendMessage = useCallback(
    (content: string | null, messageType: MessageType, imageIds: number[] = []) => {
      const tempId = addMessage({
        roomId,
        content,
        messageType,
        imageIds,
      });
      
      attemptSend(tempId, content, messageType, imageIds);
    },
    [roomId, addMessage, attemptSend]
  );
  
  useEffect(() => {
    const previouslyConnected = wasConnectedRef.current;
    if (!previouslyConnected && isSocketConnected) {
      const retryableMessages = getRetryable(roomId);
      if (retryableMessages.length > 0) {
        Toast.show({
          type: 'info',
          text1: '연결 복구',
          text2: `${retryableMessages.length}개 메시지 전송 중...`,
          visibilityTime: 1500,
        });
        retryableMessages.forEach((msg) => {
          retry(msg.tempId);
          attemptSend(msg.tempId, msg.content, msg.messageType, msg.imageIds);
        });
      }
    }
    wasConnectedRef.current = isSocketConnected;
  }, [isSocketConnected, roomId, getRetryable, retry, attemptSend]);
  
  return {
    sendMessage,
  };
};

