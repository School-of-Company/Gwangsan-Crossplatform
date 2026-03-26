import { useCallback, useMemo, useEffect, useRef } from 'react';
import { createChatSocketManager } from '@/shared/lib/socket';
import { createChatSocketService } from '../lib/socketService';
import { useSocketConnection } from './useSocketConnection';
import { useMessageSync } from './useMessageSync';
import { useSocketEventHandlers } from './useSocketEventHandlers';
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
    markRoomAsRead,
  } = useMessageSync({
    currentRoomId,
    chatRoomQueryKey,
    chatMessageQueryKey,
  });

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

  return {
    isConnected: connection.isConnected,
    connectionState: connection.connectionState,
    sendMessage,
    markRoomAsRead,
    connect: connection.connect,
    disconnect: connection.disconnect,
  };
};
