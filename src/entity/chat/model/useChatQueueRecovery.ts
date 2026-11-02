import { useEffect, useRef, useSyncExternalStore } from 'react';
import { chatSocket } from '~/shared/lib/socket';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { ChatMessageResponse } from './chatTypes';
import { matchPendingEcho } from '../lib/pendingEcho';
import { useChatSocketConnected } from './useChatSocketConnected';
import { hasActiveAutoRetryOwner, SEND_TIMEOUT_MS } from './useResilientMessageSender';

const subscribeHydration = (onChange: () => void) =>
  useChatQueueStore.persist.onFinishHydration(onChange);
const getHydrated = () => useChatQueueStore.persist.hasHydrated();

const useQueueHydrated = () => useSyncExternalStore(subscribeHydration, getHydrated, getHydrated);

// 전송 대기열은 앱을 껐다 켜도 남는다(AsyncStorage). 채팅방 화면이 열려 있는 방은 그 화면의
// useResilientMessageSender가 보내지만, 열려 있지 않은 방(재시작 직후, 끊긴 동안 보내고 방을 나간 경우)의
// 대기 메시지는 아무도 보내지 않아 계속 남는다. 앱 루트에서 소켓이 연결될 때마다 그런 메시지를 보낸다.
export const useChatQueueRecovery = () => {
  const isConnected = useChatSocketConnected();
  const isHydrated = useQueueHydrated();
  // 연결이 다시 끊겨도 이미 보낸 메시지의 응답 대기 타이머는 유지해야 "전송 중"에 갇히지 않는다
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!isConnected || !isHydrated) return;

    const { pendingMessages, setStatus } = useChatQueueStore.getState();

    pendingMessages
      .filter(
        (message) =>
          message.status === MESSAGE_STATUS.PENDING && !hasActiveAutoRetryOwner(message.roomId)
      )
      .forEach((message) => {
        setStatus(message.tempId, MESSAGE_STATUS.SENDING);
        chatSocket.emit('sendMessage', {
          roomId: message.roomId,
          content: message.content ?? '',
          messageType: message.messageType,
          imageIds: message.imageIds,
        });
        const timer = setTimeout(() => {
          timersRef.current.delete(timer);
          const current = useChatQueueStore
            .getState()
            .pendingMessages.find((m) => m.tempId === message.tempId);
          if (current?.status === MESSAGE_STATUS.SENDING) {
            setStatus(message.tempId, MESSAGE_STATUS.FAILED);
          }
        }, SEND_TIMEOUT_MS);
        timersRef.current.add(timer);
      });
  }, [isConnected, isHydrated]);

  // 채팅방·목록 화면이 없으면 echo를 처리할 useMessageSync도 없으므로 여기서 대기열에서 지운다
  useEffect(() => {
    const handleReceiveMessage = (message: ChatMessageResponse) => {
      if (!message || typeof message !== 'object' || !message.isMine) return;
      const { pendingMessages, removeMessage } = useChatQueueStore.getState();
      const matched = matchPendingEcho(pendingMessages, message);
      if (matched) removeMessage(matched.tempId);
    };

    chatSocket.on<ChatMessageResponse>('receiveMessage', handleReceiveMessage);
    return () => chatSocket.off<ChatMessageResponse>('receiveMessage', handleReceiveMessage);
  }, []);
};
