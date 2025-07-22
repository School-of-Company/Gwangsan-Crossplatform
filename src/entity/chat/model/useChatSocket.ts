import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { chatSocket } from '@/shared/lib/socket';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import { chatRoomKeys } from './useChatRooms';
import { chatMessageKeys } from './useChatMessages';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';

interface UseChatSocketOptions {
  autoConnect?: boolean;
  currentRoomId?: RoomId;
}

export const useChatSocket = ({ autoConnect = true, currentRoomId }: UseChatSocketOptions = {}) => {
  const queryClient = useQueryClient();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const handlersRef = useRef({
    handleConnect: () => {},
    handleDisconnect: (_reason: string) => {},
    handleConnectionError: (_error: Error) => {},
    handleReceiveMessage: (_message: ChatMessageResponse) => {},
    handleUpdateRoomList: (_data: any) => {},
  });

  useEffect(() => {
    handlersRef.current.handleConnect = () => {
      queryClient.invalidateQueries({ queryKey: chatRoomKeys.list() });

      if (currentRoomId) {
        queryClient.invalidateQueries({ queryKey: chatMessageKeys.room(currentRoomId) });
      }
    };

    handlersRef.current.handleReceiveMessage = async (message: ChatMessageResponse) => {
      try {
        const userId = await getCurrentUserId();
        const correctedMessage = {
          ...message,
          isMine: message.senderId === userId,
        };

        if (currentRoomId && correctedMessage.roomId === currentRoomId) {
          queryClient.setQueryData(
            chatMessageKeys.room(currentRoomId),
            (oldData: ChatMessageResponse[] | undefined) => {
              if (!oldData) return [correctedMessage];

              const exists = oldData.some((msg) => msg.messageId === correctedMessage.messageId);
              if (exists) return oldData;

              return [...oldData, correctedMessage].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            }
          );
        }

        queryClient.setQueryData(chatRoomKeys.list(), (oldData: ChatRoomListItem[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map((room) => {
            if (room.roomId === correctedMessage.roomId) {
              return {
                ...room,
                lastMessage: correctedMessage.content || '(사진)',
                lastMessageType: correctedMessage.messageType,
                lastMessageTime: correctedMessage.createdAt,
                unreadMessageCount: correctedMessage.isMine
                  ? room.unreadMessageCount
                  : room.unreadMessageCount + 1,
              };
            }
            return room;
          });
        });
      } catch (error) {
        console.error(error);
      }
    };

    handlersRef.current.handleUpdateRoomList = (data: {
      roomId: number;
      lastMessage: string;
      lastMessageType: string;
      lastMessageTime: string;
    }) => {
      queryClient.setQueryData(chatRoomKeys.list(), (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((room) => {
          if (room.roomId === data.roomId) {
            return {
              ...room,
              lastMessage: data.lastMessage,
              lastMessageType: data.lastMessageType as any,
              lastMessageTime: data.lastMessageTime,
            };
          }
          return room;
        });
      });
    };
  }, [queryClient, currentRoomId]);

  useEffect(() => {
    const connectHandler = () => handlersRef.current.handleConnect();
    const disconnectHandler = (reason: string) => handlersRef.current.handleDisconnect(reason);
    const errorHandler = (error: Error) => handlersRef.current.handleConnectionError(error);
    const messageHandler = (message: ChatMessageResponse) =>
      handlersRef.current.handleReceiveMessage(message);
    const updateHandler = (data: any) => handlersRef.current.handleUpdateRoomList(data);

    chatSocket.on('connect', connectHandler);
    chatSocket.on('disconnect', disconnectHandler);
    chatSocket.on('connect_error', errorHandler);
    chatSocket.on('receiveMessage', messageHandler);
    chatSocket.on('updateRoomList', updateHandler);

    return () => {
      chatSocket.off('connect', connectHandler);
      chatSocket.off('disconnect', disconnectHandler);
      chatSocket.off('connect_error', errorHandler);
      chatSocket.off('receiveMessage', messageHandler);
      chatSocket.off('updateRoomList', updateHandler);
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (autoConnect && !chatSocket.isConnected) {
          chatSocket.connect().catch(console.error);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [autoConnect]);

  useFocusEffect(
    useCallback(() => {
      if (autoConnect && !chatSocket.isConnected) {
        chatSocket.connect().catch(console.error);
      }
    }, [autoConnect])
  );

  useEffect(() => {
    if (autoConnect && !chatSocket.isConnected) {
      chatSocket.connect().catch(console.error);
    }
  }, [autoConnect]);

  const sendMessage = useCallback(
    async (
      roomId: RoomId,
      content: string | null,
      messageType: 'TEXT' | 'IMAGE' = 'TEXT',
      imageIds: number[] = []
    ) => {
      chatSocket.sendMessage({
        roomId,
        content,
        messageType,
        imageIds,
      });
    },
    []
  );

  const markRoomAsRead = useCallback(
    (roomId: RoomId) => {
      queryClient.setQueryData(chatRoomKeys.list(), (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((room) => {
          if (room.roomId === roomId) {
            return { ...room, unreadMessageCount: 0 };
          }
          return room;
        });
      });
    },
    [queryClient]
  );

  return {
    isConnected: chatSocket.isConnected,
    connectionState: chatSocket.connectionState,
    sendMessage,
    markRoomAsRead,
    connect: useCallback(() => chatSocket.connect(), []),
    disconnect: useCallback(() => chatSocket.disconnect(), []),
  };
};
