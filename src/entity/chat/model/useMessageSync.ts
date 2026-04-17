import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markChatAsRead } from '../api/markChatAsRead';
import { useChatQueueStore } from '~/shared/store/useChatQueueStore';
import type { ChatMessageResponse, ChatRoomListItem } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';
import { getCurrentUserId } from '~/shared/lib/getCurrentUserId';
import { chatMessageKeys } from './chatQueryKeys';
import { logger } from '~/shared/lib/logger';

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
  const userIdRef = useRef<number | null>(null);

  useEffect(() => {
    getCurrentUserId()
      .then((id) => {
        userIdRef.current = id;
      })
      .catch((error) => {
        logger.error('Failed to get current user ID', error);
      });
  }, []);

  const handleConnect = useCallback(() => {
    if (chatRoomQueryKey) {
      queryClient.invalidateQueries({ queryKey: chatRoomQueryKey });
    }
  }, [queryClient, chatRoomQueryKey]);

  const handleReceiveMessage = useCallback(
    (message: ChatMessageResponse) => {
      try {
        if (!message || typeof message !== 'object') return;

        const userId = userIdRef.current;
        if (!userId) return;

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

          const queueState = useChatQueueStore.getState();
          const matchingTemp = queueState.pendingMessages.find((msg) => {
            if (
              msg.roomId !== correctedMessage.roomId ||
              msg.messageType !== correctedMessage.messageType
            ) {
              return false;
            }
            if (msg.messageType === 'IMAGE') {
              if (
                !correctedMessage.images ||
                correctedMessage.images.length !== msg.imageIds.length
              ) {
                return false;
              }
              const receivedImageIds = new Set(correctedMessage.images.map((img) => img.imageId));
              return msg.imageIds.every((id) => receivedImageIds.has(id));
            }
            return msg.content === correctedMessage.content;
          });
          if (matchingTemp) {
            queueState.removeMessage(matchingTemp.tempId);
          }
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
        logger.error('handleReceiveMessage error', error);
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

      const resetUnreadCount = () => {
        queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((room) =>
            room.roomId === roomId ? { ...room, unreadMessageCount: 0 } : room
          );
        });
      };

      const messages = queryClient.getQueryData(
        chatMessageQueryKey ?? chatMessageKeys.room(roomId)
      ) as ChatMessageResponse[] | undefined;
      const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

      if (!lastMessage) {
        resetUnreadCount();
        return;
      }

      try {
        await markChatAsRead(roomId, lastMessage.messageId);
      } catch (error) {
        logger.error('markRoomAsRead failed', error);
      } finally {
        resetUnreadCount();
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
