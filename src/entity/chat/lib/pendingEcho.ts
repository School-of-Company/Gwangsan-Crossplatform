import type { PendingMessage } from '~/shared/store/useChatQueueStore';
import type { ChatMessageResponse } from '../model/chatTypes';

const isPendingEchoOf = (pending: PendingMessage, message: ChatMessageResponse): boolean => {
  // 상대방이 보낸 메시지가 우연히 같은 content/이미지 개수를 가져도 내가 보낸 pending
  // 항목을 지워버리지 않도록, 반드시 내가 보낸 echo에 대해서만 매칭한다.
  if (
    !message.isMine ||
    pending.roomId !== message.roomId ||
    pending.messageType !== message.messageType
  ) {
    return false;
  }
  if (pending.messageType === 'IMAGE') {
    if (message.images && message.images.length > 0) {
      if (message.images.length !== pending.imageIds.length) {
        return false;
      }
      const receivedImageIds = new Set(message.images.map((img) => img.imageId));
      return pending.imageIds.every((id) => receivedImageIds.has(id));
    }
    // 서버가 전송 직후 echo에는 images를 채워 보내지 않아(Gwangsan-Chatting-Server
    // chat.service.ts의 알려진 동작) 이미지 개수/ID로 대조할 수 없는 경우가 있다.
    // pendingMessages는 추가된 순서를 유지하므로 find()가 자연히 같은 방에서 가장
    // 먼저 보낸(=서버가 가장 먼저 처리했을) 이미지 메시지를 골라 FIFO로 매칭한다.
    return true;
  }
  return pending.content === message.content;
};

// 같은 receiveMessage 이벤트를 여러 구독자(채팅방·목록의 useMessageSync, 전역 대기열 복구)가 처리한다.
// 먼저 처리한 쪽이 매칭된 항목을 지운 뒤 다음 구독자가 다시 찾으면, 내용이 같은 다른 대기 메시지를
// 잘못 짝지어 지울 수 있다. 이벤트 객체(모든 구독자가 같은 참조를 받는다)마다 첫 매칭 결과를 기억해
// 모두가 같은 대기 메시지를 확정하게 한다.
const matchedByEcho = new WeakMap<ChatMessageResponse, PendingMessage | undefined>();

export const matchPendingEcho = (
  pendingMessages: readonly PendingMessage[],
  message: ChatMessageResponse
): PendingMessage | undefined => {
  if (matchedByEcho.has(message)) return matchedByEcho.get(message);
  const match = pendingMessages.find((pending) => isPendingEchoOf(pending, message));
  matchedByEcho.set(message, match);
  return match;
};
