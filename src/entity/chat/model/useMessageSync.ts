import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markChatAsRead } from '../api/markChatAsRead';
import { useChatQueueStore } from '~/shared/store/useChatQueueStore';
import { useReadRoomsStore } from '~/shared/store/useReadRoomsStore';
import type { ChatMessageResponse, ChatRoomListItem, ChatRoomWithProduct } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';
import { getCurrentUserId } from '~/shared/lib/getCurrentUserId';
import { chatMessageKeys } from './chatQueryKeys';
import { logger } from '~/shared/lib/logger';
import type { TransactionStateChangedPayload } from '../lib/socketService';

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
  const pendingMessagesRef = useRef<ChatMessageResponse[]>([]);
  const processMessageRef = useRef<
    ((message: ChatMessageResponse, userId: number) => void) | undefined
  >(undefined);

  useEffect(() => {
    getCurrentUserId()
      .then((id) => {
        userIdRef.current = id;
        const queued = pendingMessagesRef.current;
        pendingMessagesRef.current = [];
        queued.forEach((queuedMessage) => processMessageRef.current?.(queuedMessage, id));
      })
      .catch((error) => {
        logger.error('Failed to get current user ID', error);
      });
  }, []);

  const handleConnect = useCallback(() => {
    if (chatRoomQueryKey) {
      queryClient.invalidateQueries({ queryKey: chatRoomQueryKey });
    }
    if (currentRoomId !== undefined) {
      queryClient.invalidateQueries({ queryKey: ['chatRoomData', currentRoomId] });
    }
  }, [queryClient, chatRoomQueryKey, currentRoomId]);

  const processMessage = useCallback(
    (message: ChatMessageResponse, userId: number) => {
      try {
        const correctedMessage = {
          ...message,
          isMine: message.senderId === userId,
        };

        const isCurrentRoomMessage = currentRoomId && correctedMessage.roomId === currentRoomId;

        if (isCurrentRoomMessage && !correctedMessage.isMine) {
          useReadRoomsStore
            .getState()
            .markRead(correctedMessage.roomId, correctedMessage.messageId);
          markChatAsRead(correctedMessage.roomId, correctedMessage.messageId).catch((error) => {
            logger.error('markChatAsRead (auto) failed', error);
          });
        }

        if (isCurrentRoomMessage && chatMessageQueryKey) {
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
              if (room.roomId !== correctedMessage.roomId) return room;
              if (room.messageId === correctedMessage.messageId) return room;

              const incomingTime = new Date(correctedMessage.createdAt).getTime();
              const lastTime = new Date(room.lastMessageTime).getTime();
              const isStale = Number.isFinite(lastTime) && incomingTime < lastTime;
              if (isStale) return room;

              const isActiveRoom = room.roomId === currentRoomId;
              const nextUnreadCount = isActiveRoom
                ? 0
                : correctedMessage.isMine
                  ? room.unreadMessageCount
                  : room.unreadMessageCount + 1;

              return {
                ...room,
                messageId: correctedMessage.messageId,
                lastMessage: correctedMessage.content || '(사진)',
                lastMessageType: correctedMessage.messageType,
                lastMessageTime: correctedMessage.createdAt,
                unreadMessageCount: nextUnreadCount,
              };
            });
          });
        }
      } catch (error) {
        logger.error('handleReceiveMessage error', error);
      }
    },
    [queryClient, currentRoomId, chatRoomQueryKey, chatMessageQueryKey]
  );
  processMessageRef.current = processMessage;

  const handleReceiveMessage = useCallback(
    (message: ChatMessageResponse) => {
      if (!message || typeof message !== 'object') return;

      const userId = userIdRef.current;
      if (!userId) {
        pendingMessagesRef.current.push(message);
        return;
      }

      processMessage(message, userId);
    },
    [processMessage]
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

  const handleTransactionStateChanged = useCallback(
    (data: TransactionStateChangedPayload) => {
      if (!currentRoomId || data.roomId !== currentRoomId) return;

      queryClient.setQueryData<ChatRoomWithProduct>(['chatRoomData', currentRoomId], (old) => {
        if (!old?.product) return old;
        return {
          ...old,
          product: {
            ...old.product,
            isCompleted: data.isCompleted,
            isCompletable: data.isCompleted ? false : old.product.isCompletable,
            ...(typeof data.isReserved === 'boolean' ? { isReserved: data.isReserved } : {}),
            ...(data.createdAt && !old.product.createdAt ? { createdAt: data.createdAt } : {}),
          },
        };
      });
    },
    [queryClient, currentRoomId]
  );

  const markRoomAsRead = useCallback(
    async (roomId: RoomId) => {
      if (!chatRoomQueryKey) return;

      const resetUnreadCount = (readMessageId?: ChatMessageResponse['messageId']) => {
        queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((room) => {
            if (room.roomId !== roomId) return room;
            const resolvedReadMessageId = readMessageId ?? room.messageId;
            if (resolvedReadMessageId !== undefined) {
              useReadRoomsStore.getState().markRead(roomId, resolvedReadMessageId);
            }
            return { ...room, unreadMessageCount: 0 };
          });
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
        resetUnreadCount(lastMessage.messageId);
      }
    },
    [queryClient, chatRoomQueryKey, chatMessageQueryKey]
  );

  return {
    handleConnect,
    handleReceiveMessage,
    handleUpdateRoomList,
    handleTransactionStateChanged,
    markRoomAsRead,
  };
};
