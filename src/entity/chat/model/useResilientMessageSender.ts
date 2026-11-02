import { useCallback, useEffect, useRef } from 'react';
import {
  useChatQueueStore,
  MESSAGE_STATUS,
  type PendingMessageImage,
} from '~/shared/store/useChatQueueStore';
import type { RoomId, SendableMessageType } from '~/shared/types/chatType';
import Toast from 'react-native-toast-message';
import { logger } from '~/shared/lib/logger';

// Expo Router 스택은 이전 화면을 언마운트하지 않으므로, 같은 방의 채팅방 화면이 스택에 두 번
// 쌓이면(채팅방 → 프로필 → 게시글 → 같은 채팅방) 이 훅도 여러 개 살아있을 수 있다. 재연결·재시도
// 트리거는 store 전체를 구독하는 전역 효과라 인스턴스 수만큼 중복 실행되면 같은 메시지가
// 여러 소켓 emit으로 중복 전송된다. roomId당 정확히 하나의 인스턴스만 이 트리거를 맡도록 한다.
const activeAutoRetryOwners = new Set<RoomId>();

// 채팅방 화면이 열려 있지 않은 방의 대기 메시지는 전역 대기열 복구(useChatQueueRecovery)가 보낸다
export const hasActiveAutoRetryOwner = (roomId: RoomId) => activeAutoRetryOwners.has(roomId);

export const SEND_TIMEOUT_MS = 10000;

// 소켓 emit 자체가 실패한 경우(서버에 닿지 않았으니 다시 보내도 중복되지 않는다)에만 자동으로
// 다시 시도한다. 2초 → 4초 → 8초 뒤 세 번까지 시도하고, 그래도 실패하면 토스트로 알린다.
// 응답(echo)이 오지 않은 타임아웃은 서버가 받았을 수 있어 자동 재전송하지 않는다.
export const MAX_AUTO_RETRY_COUNT = 3;
export const getAutoRetryDelay = (retryCount: number) => Math.min(2000 * 2 ** retryCount, 30_000);

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
    type: SendableMessageType,
    imageIds: number[]
  ) => void;
}

export const useResilientMessageSender = ({
  roomId,
  isSocketConnected,
  socketSendMessage,
}: ResilientSenderProps) => {
  const wasConnectedRef = useRef<boolean>(isSocketConnected);
  const isAutoRetryOwnerRef = useRef(false);

  useEffect(() => {
    if (activeAutoRetryOwners.has(roomId)) {
      isAutoRetryOwnerRef.current = false;
      return;
    }
    activeAutoRetryOwners.add(roomId);
    isAutoRetryOwnerRef.current = true;
    return () => {
      if (isAutoRetryOwnerRef.current) {
        activeAutoRetryOwners.delete(roomId);
        isAutoRetryOwnerRef.current = false;
      }
    };
  }, [roomId]);

  const addMessage = useChatQueueStore((state) => state.addMessage);
  const setStatus = useChatQueueStore((state) => state.setStatus);
  const getRetryable = useChatQueueStore((state) => state.getRetryable);
  const retry = useChatQueueStore((state) => state.retry);

  const attemptSend = useCallback(
    async (
      tempId: string,
      content: string | null,
      messageType: SendableMessageType,
      imageIds: number[]
    ) => {
      try {
        if (!isSocketConnected) {
          setStatus(tempId, MESSAGE_STATUS.PENDING);
          return;
        }

        setStatus(tempId, MESSAGE_STATUS.SENDING);

        // IMAGE는 content 없이도 서버가 받는다. 공백(' ')을 채우면 그대로 저장돼 사진 밑에 빈 말풍선이
        // 생기므로 빈 문자열로 보낸다
        await socketSendMessage(roomId, content ?? '', messageType, imageIds);

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
        const retryCount =
          useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId)
            ?.retryCount ?? 0;
        if (retryCount < MAX_AUTO_RETRY_COUNT) {
          setTimeout(() => {
            const current = useChatQueueStore
              .getState()
              .pendingMessages.find((m) => m.tempId === tempId);
            if (current?.status === MESSAGE_STATUS.FAILED) retry(tempId);
          }, getAutoRetryDelay(retryCount));
          return;
        }
        showSendFailedToast(() => retry(tempId));
      }
    },
    [isSocketConnected, socketSendMessage, roomId, setStatus, retry]
  );

  const sendMessage = useCallback(
    (
      content: string | null,
      messageType: SendableMessageType,
      imageIds: number[] = [],
      images?: PendingMessageImage[]
    ) => {
      const tempId = addMessage({
        roomId,
        content,
        messageType,
        imageIds,
        images,
      });

      attemptSend(tempId, content, messageType, imageIds);
    },
    [roomId, addMessage, attemptSend]
  );

  // Reconnect: retry pending/failed messages
  useEffect(() => {
    const previouslyConnected = wasConnectedRef.current;
    if (!previouslyConnected && isSocketConnected && isAutoRetryOwnerRef.current) {
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
      if (!isSocketConnected || !isAutoRetryOwnerRef.current) return;
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
