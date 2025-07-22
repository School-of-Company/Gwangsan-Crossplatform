import { useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { createChatSocketManager } from '@/shared/lib/socket';
import { createChatSocketService } from '../lib/socketService';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
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
  chatMessageQueryKey
}: useChatSocketProps = {}) => {
  const queryClient = useQueryClient();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  const chatSocketService = useMemo(() => {
    const socketManager = createChatSocketManager();
    return createChatSocketService(socketManager);
  }, []);

  const handlersRef = useRef({
    handleConnect: () => {
      if (chatRoomQueryKey) {
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKey });
      }

      if (currentRoomId && chatMessageQueryKey) {
        queryClient.invalidateQueries({ queryKey: chatMessageQueryKey });
      }
    },

    handleReceiveMessage: async (message: ChatMessageResponse) => {
      try {
        const userId = await getCurrentUserId();
        const correctedMessage = {
          ...message,
          isMine: message.senderId === userId,
        };

        if (currentRoomId && correctedMessage.roomId === currentRoomId && chatMessageQueryKey) {
          queryClient.setQueryData(
            chatMessageQueryKey,
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

        if (chatRoomQueryKey) {
          queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
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
        }
      } catch (error) {
        console.error(error);
      }
    },

    handleUpdateRoomList: (data: {
      roomId: number;
      lastMessage: string;
      lastMessageType: string;
      lastMessageTime: string;
    }) => {
      if (!chatRoomQueryKey) return;

      queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
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
    },
  });

  useEffect(() => {
    const { handleConnect, handleReceiveMessage, handleUpdateRoomList } = handlersRef.current;

    chatSocketService.on('connect', handleConnect);
    chatSocketService.on('receiveMessage', handleReceiveMessage);
    chatSocketService.on('updateRoomList', handleUpdateRoomList);

    return () => {
      chatSocketService.off('connect', handleConnect);
      chatSocketService.off('receiveMessage', handleReceiveMessage);
      chatSocketService.off('updateRoomList', handleUpdateRoomList);
    };
  }, [chatSocketService, currentRoomId, chatRoomQueryKey, chatMessageQueryKey]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (autoConnect && !chatSocketService.isConnected) {
          chatSocketService.connect().catch(console.error);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [autoConnect, chatSocketService]);

  useFocusEffect(
    useCallback(() => {
      if (autoConnect && !chatSocketService.isConnected) {
        chatSocketService.connect().catch(console.error);
      }
    }, [autoConnect, chatSocketService])
  );

  useEffect(() => {
    if (autoConnect && !chatSocketService.isConnected) {
      chatSocketService.connect().catch(console.error);
    }
  }, [autoConnect, chatSocketService]);

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

  const markRoomAsRead = useCallback(
    (roomId: RoomId) => {
      if (!chatRoomQueryKey) return;

      queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((room) => {
          if (room.roomId === roomId) {
            return { ...room, unreadMessageCount: 0 };
          }
          return room;
        });
      });
    },
    [queryClient, chatRoomQueryKey]
  );

  return {
    isConnected: chatSocketService.isConnected,
    connectionState: chatSocketService.connectionState,
    sendMessage,
    markRoomAsRead,
    connect: useCallback(() => chatSocketService.connect(), [chatSocketService]),
    disconnect: useCallback(() => chatSocketService.disconnect(), [chatSocketService]),
  };
};
