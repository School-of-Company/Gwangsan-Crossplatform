import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { chatSocket } from '@/shared/lib/socket';
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

  // 핸들러들을 ref에 저장하여 의존성 배열 최적화
  useEffect(() => {
    handlersRef.current.handleConnect = () => {
      console.log('Chat server connected');
      queryClient.invalidateQueries({ queryKey: chatRoomKeys.list() });

      if (currentRoomId) {
        queryClient.invalidateQueries({ queryKey: chatMessageKeys.room(currentRoomId) });
      }
    };

    handlersRef.current.handleDisconnect = (reason: string) => {
      console.log('Chat server disconnected:', reason);
    };

    handlersRef.current.handleConnectionError = (error: Error) => {
      console.error('Chat server connection error:', error);
    };

    handlersRef.current.handleReceiveMessage = (message: ChatMessageResponse) => {
      // 현재 채팅방의 메시지라면 즉시 업데이트
      if (currentRoomId && message.roomId === currentRoomId) {
        queryClient.setQueryData(
          chatMessageKeys.room(currentRoomId),
          (oldData: ChatMessageResponse[] | undefined) => {
            if (!oldData) return [message];

            // 중복 메시지 방지
            const exists = oldData.some((msg) => msg.messageId === message.messageId);
            if (exists) return oldData;

            return [...oldData, message].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
        );
      }

      // 채팅방 목록 업데이트
      queryClient.setQueryData(chatRoomKeys.list(), (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((room) => {
          if (room.roomId === message.roomId) {
            return {
              ...room,
              lastMessage: message.content || '📷 사진',
              lastMessageType: message.messageType,
              lastMessageTime: message.createdAt,
              unreadMessageCount: message.isMine
                ? room.unreadMessageCount
                : room.unreadMessageCount + 1,
            };
          }
          return room;
        });
      });
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

  // 이벤트 리스너 설정 - 의존성 없이 ref 사용
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
  }, []); // 의존성 배열 비움

  // 앱 상태 변경에 따른 소켓 연결 관리
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

  // 화면 포커스 시 연결 확인
  useFocusEffect(
    useCallback(() => {
      if (autoConnect && !chatSocket.isConnected) {
        chatSocket.connect().catch(console.error);
      }
    }, [autoConnect])
  );

  // 초기 연결
  useEffect(() => {
    if (autoConnect && !chatSocket.isConnected) {
      chatSocket.connect().catch(console.error);
    }
  }, [autoConnect]);

  // 메시지 전송 함수
  const sendMessage = useCallback(
    (
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

  // 읽음 처리 함수
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
