import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { createChatSocketManager } from '@/shared/lib/socket';
import { createChatSocketService, type SocketErrorPayload } from '../lib/socketService';
import { isBlockedSocketError } from '../lib/blockError';
import { useSocketConnection } from './useSocketConnection';
import { useMessageSync } from './useMessageSync';
import { useSocketEventHandlers } from './useSocketEventHandlers';
import { useChatQueueStore, MESSAGE_STATUS } from '@/shared/store/useChatQueueStore';
import type { RoomId } from '@/shared/types/chatType';

interface useChatSocketProps {
  autoConnect?: boolean;
  currentRoomId?: RoomId;
  chatRoomQueryKey?: readonly unknown[];
  chatMessageQueryKey?: readonly unknown[];
}

export const useChatSocket = ({
  autoConnect = true,
  currentRoomId,
  chatRoomQueryKey,
  chatMessageQueryKey,
}: useChatSocketProps = {}) => {
  const chatSocketService = useMemo(() => {
    const socketManager = createChatSocketManager();
    return createChatSocketService(socketManager);
  }, []);

  const connection = useSocketConnection({
    socketService: chatSocketService,
    autoConnect,
  });

  const {
    handleConnect: handleMessageSyncConnect,
    handleReceiveMessage,
    handleUpdateRoomList,
    handleTransactionStateChanged,
    markRoomAsRead,
  } = useMessageSync({
    currentRoomId,
    chatRoomQueryKey,
    chatMessageQueryKey,
  });

  const [isBlockedByOtherUser, setIsBlockedByOtherUser] = useState(false);
  // 방을 옮기면 이전 방에서의 차단 안내가 새 방까지 이어지지 않도록 초기화한다.
  const [blockStateRoomId, setBlockStateRoomId] = useState(currentRoomId);
  if (currentRoomId !== blockStateRoomId) {
    setBlockStateRoomId(currentRoomId);
    setIsBlockedByOtherUser(false);
  }

  const handleSocketError = useCallback(
    (error: SocketErrorPayload) => {
      if (!isBlockedSocketError(error)) return;

      setIsBlockedByOtherUser(true);

      // 서버가 403으로 거부한 전송은 receiveMessage로 echo되지 않아, 낙관적으로 큐에 남아있던
      // 메시지가 10초 타임아웃까지 "전송 중"으로 붙잡혀 원인 불명의 실패 토스트로 이어진다.
      // 차단으로 인한 실패임이 확인된 즉시 실패로 전환해 정확한 안내를 띄운다.
      if (currentRoomId !== undefined) {
        const { pendingMessages, setStatus } = useChatQueueStore.getState();
        pendingMessages
          .filter((m) => m.roomId === currentRoomId && m.status === MESSAGE_STATUS.SENDING)
          .forEach((m) => setStatus(m.tempId, MESSAGE_STATUS.FAILED));
      }

      Toast.show({
        type: 'error',
        text1: '메시지를 보낼 수 없어요',
        text2: '상대방이 차단하여 메시지를 전송할 수 없습니다.',
        visibilityTime: 4000,
      });
    },
    [currentRoomId]
  );

  const joinedRoomRef = useRef<RoomId | null>(null);

  const joinCurrentRoom = useCallback(() => {
    if (currentRoomId && chatSocketService.isConnected) {
      chatSocketService.joinRoom(currentRoomId);
      joinedRoomRef.current = currentRoomId;
    }
  }, [currentRoomId, chatSocketService]);

  const handleConnect = useCallback(() => {
    handleMessageSyncConnect();
    joinCurrentRoom();
  }, [handleMessageSyncConnect, joinCurrentRoom]);

  useSocketEventHandlers({
    socketService: chatSocketService,
    onConnect: handleConnect,
    onReceiveMessage: handleReceiveMessage,
    onUpdateRoomList: handleUpdateRoomList,
    onTransactionStateChanged: handleTransactionStateChanged,
    // currentRoomId가 없는 호출(예: 채팅 목록 화면)은 특정 방의 전송 실패와 무관하므로 구독하지 않는다.
    // 화면 전환 시 이전 화면이 그대로 마운트된 채 남아 있어도(Expo Router 스택), 같은 소켓 error
    // 이벤트를 여러 useChatSocket 인스턴스가 동시에 처리해 토스트가 중복으로 뜨는 것을 막는다.
    onError: currentRoomId !== undefined ? handleSocketError : undefined,
  });

  useEffect(() => {
    if (!currentRoomId) return;

    joinCurrentRoom();

    return () => {
      if (joinedRoomRef.current !== null && chatSocketService.isConnected) {
        chatSocketService.leaveRoom(joinedRoomRef.current);
        joinedRoomRef.current = null;
      }
    };
  }, [currentRoomId, chatSocketService, joinCurrentRoom]);

  useEffect(() => {
    return () => {
      chatSocketService.destroy();
    };
  }, [chatSocketService]);

  const sendMessage = useCallback(
    async (
      roomId: RoomId,
      content: string,
      messageType: 'TEXT' | 'IMAGE' = 'TEXT',
      imageIds: number[] = []
    ) => {
      chatSocketService.sendMessage({
        roomId,
        content,
        messageType,
        imageIds,
      });
    },
    [chatSocketService]
  );

  const joinRoom = useCallback(
    (roomId: RoomId) => {
      if (chatSocketService.isConnected) {
        chatSocketService.joinRoom(roomId);
      }
    },
    [chatSocketService]
  );

  const leaveRoom = useCallback(
    (roomId: RoomId) => {
      chatSocketService.leaveRoom(roomId);
    },
    [chatSocketService]
  );

  return {
    isConnected: connection.isConnected,
    connectionState: connection.connectionState,
    isBlockedByOtherUser,
    sendMessage,
    joinRoom,
    leaveRoom,
    markRoomAsRead,
    connect: connection.connect,
    disconnect: connection.disconnect,
  };
};
