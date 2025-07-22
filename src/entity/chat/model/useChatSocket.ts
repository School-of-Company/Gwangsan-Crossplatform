import { useCallback, useMemo } from 'react';
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

  const messageSync = useMessageSync({
    currentRoomId,
    chatRoomQueryKey,
    chatMessageQueryKey,
  });

  useSocketEventHandlers({
    socketService: chatSocketService,
    onConnect: messageSync.handleConnect,
    onReceiveMessage: messageSync.handleReceiveMessage,
    onUpdateRoomList: messageSync.handleUpdateRoomList,
  });

  const sendMessage = useCallback(
    async (
      roomId: RoomId,
      content: string | null,
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
    markRoomAsRead: messageSync.markRoomAsRead,
    connect: connection.connect,
    disconnect: connection.disconnect,
  };
};
