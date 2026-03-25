import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markChatAsRead } from '../api/markChatAsRead';
import { useChatQueueStore } from '~/shared/store/useChatQueueStore';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';

interface UseMessageSyncProps {
  currentRoomId?: RoomId;
  chatRoomQueryKey?: readonly unknown[];
  chatMessageQueryKey?: readonly unknown[];
}

export const useMessageSync = ({
  currentRoomId,
  chatRoomQueryKey,
  chatMessageQueryKey,
}: UseMessageSyncProps) => {
  const queryClient = useQueryClient();

  const handleConnect = useCallback(() => {
    if (chatRoomQueryKey) {
      queryClient.invalidateQueries({ queryKey: chatRoomQueryKey });
    }
  }, [queryClient, chatRoomQueryKey]);

  const handleReceiveMessage = useCallback(
    (message: ChatMessageResponse) => {
      try {
        if (!message || typeof message !== 'object') return;

        if (currentRoomId && message.roomId === currentRoomId && chatMessageQueryKey) {
          queryClient.setQueryData(
            chatMessageQueryKey,
            (oldData: ChatMessageResponse[] | undefined) => {
              if (!oldData) return [message];

              const exists = oldData.some((msg) => msg.messageId === message.messageId);
              if (exists) return oldData;

              return [...oldData, message].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            }
          );

          const queueState = useChatQueueStore.getState();
          const matchingTemp = queueState.pendingMessages.find((msg) => {
            if (msg.roomId !== message.roomId || msg.messageType !== message.messageType) {
              return false;
            }
            if (msg.messageType === 'IMAGE') {
              if (!message.images || message.images.length !== msg.imageIds.length) {
                return false;
              }
              const receivedImageIds = new Set(message.images.map((img) => img.imageId));
              return msg.imageIds.every((id) => receivedImageIds.has(id));
            }
            return msg.content === message.content;
          });
          if (matchingTemp) {
            queueState.removeMessage(matchingTemp.tempId);
          }
        }

        if (chatRoomQueryKey) {
          queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
            if (!oldData) return oldData;

            return oldData.map((room) => {
              if (room.roomId === message.roomId) {
                return {
                  ...room,
                  lastMessage: message.content || '(사진)',
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
        }
      } catch (error) {
        console.error(error);
      }
    },
    [queryClient, currentRoomId, chatRoomQueryKey, chatMessageQueryKey]
  );

  const handleUpdateRoomList = useCallback(
    (data: {
      roomId: number;
      lastMessage: string;
      lastMessageType: string;
      lastMessageTime: string;
    }) => {
      if (!chatRoomQueryKey) {
        return;
      }

      queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) {
          return oldData;
        }

        const updatedData = oldData.map((room) => {
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

        return updatedData;
      });
    },
    [queryClient, chatRoomQueryKey]
  );

  const markRoomAsRead = useCallback(
    async (roomId: RoomId) => {
      if (!chatRoomQueryKey) return;

      const messages = queryClient.getQueryData(chatMessageQueryKey || ['chatMessages', roomId]) as
        | ChatMessageResponse[]
        | undefined;
      const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

      if (!lastMessage) {
        queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map((room) => {
            if (room.roomId === roomId) {
              return { ...room, unreadMessageCount: 0 };
            }
            return room;
          });
        });
        return;
      }

      try {
        await markChatAsRead(roomId, lastMessage.messageId);

        queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map((room) => {
            if (room.roomId === roomId) {
              return { ...room, unreadMessageCount: 0 };
            }
            return room;
          });
        });
      } catch (error) {
        console.error(error);
        queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map((room) => {
            if (room.roomId === roomId) {
              return { ...room, unreadMessageCount: 0 };
            }
            return room;
          });
        });
      }
    },
    [queryClient, chatRoomQueryKey, chatMessageQueryKey]
  );

  return {
    handleConnect,
    handleReceiveMessage,
    handleUpdateRoomList,
    markRoomAsRead,
  };
};
