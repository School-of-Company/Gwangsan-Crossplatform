import { useCallback, useEffect, useRef } from 'react';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { RoomId, MessageType } from '~/shared/types/chatType';
import Toast from 'react-native-toast-message';
import { logger } from '~/shared/lib/logger';

const SEND_TIMEOUT_MS = 10000;

const showSendFailedToast = (onRetry: () => void) => {
  Toast.show({
    type: 'error',
    text1: '메시지 전송 실패',
    text2: '다시 시도하려면 탭하세요',
    onPress: onRetry,
    visibilityTime: 4000,
  });
};

interface ResilientSenderProps {
  roomId: RoomId;
  isSocketConnected: boolean;
  socketSendMessage: (
    roomId: RoomId,
    content: string,
    type: MessageType,
    imageIds: number[]
  ) => void;
}

export const useResilientMessageSender = ({
  roomId,
  isSocketConnected,
  socketSendMessage,
}: ResilientSenderProps) => {
  const wasConnectedRef = useRef<boolean>(isSocketConnected);

  const addMessage = useChatQueueStore((state) => state.addMessage);
  const setStatus = useChatQueueStore((state) => state.setStatus);
  const getRetryable = useChatQueueStore((state) => state.getRetryable);
  const retry = useChatQueueStore((state) => state.retry);

  const attemptSend = useCallback(
    async (
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

        await socketSendMessage(
          roomId,
          content || (messageType === 'IMAGE' ? ' ' : ''),
          messageType,
          imageIds
        );

        setTimeout(() => {
          const currentMsg = useChatQueueStore
            .getState()
            .pendingMessages.find((m) => m.tempId === tempId);
          if (currentMsg && currentMsg.status === MESSAGE_STATUS.SENDING) {
            setStatus(tempId, MESSAGE_STATUS.FAILED);
            showSendFailedToast(() => retry(tempId));
          }
        }, SEND_TIMEOUT_MS);
      } catch (error) {
        logger.error('Message send failed', error);
        setStatus(tempId, MESSAGE_STATUS.FAILED);
        showSendFailedToast(() => retry(tempId));
      }
    },
    [isSocketConnected, socketSendMessage, roomId, setStatus, retry]
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

  // Reconnect: retry pending/failed messages
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
        });
      }
    }
    wasConnectedRef.current = isSocketConnected;
  }, [isSocketConnected, roomId, getRetryable, retry, attemptSend]);

  useEffect(() => {
    const unsubscribe = useChatQueueStore.subscribe((state) => {
      if (!isSocketConnected) return;
      state.pendingMessages
        .filter(
          (m) => m.roomId === roomId && m.status === MESSAGE_STATUS.PENDING && m.retryCount > 0
        )
        .forEach((msg) => {
          attemptSend(msg.tempId, msg.content, msg.messageType, msg.imageIds);
        });
    });
    return unsubscribe;
  }, [isSocketConnected, roomId, attemptSend]);

  return {
    sendMessage,
  };
};
