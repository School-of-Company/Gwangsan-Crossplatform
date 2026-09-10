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
          const queueState = useChatQueueStore.getState();
          const matchingTemp = queueState.pendingMessages.find((msg) => {
            // 상대방이 보낸 메시지가 우연히 같은 content/이미지 개수를 가져도 내가 보낸 pending
            // 항목을 지워버리지 않도록, 반드시 내가 보낸 echo에 대해서만 매칭한다.
            if (
              !correctedMessage.isMine ||
              msg.roomId !== correctedMessage.roomId ||
              msg.messageType !== correctedMessage.messageType
            ) {
              return false;
            }
            if (msg.messageType === 'IMAGE') {
              if (correctedMessage.images && correctedMessage.images.length > 0) {
                if (correctedMessage.images.length !== msg.imageIds.length) {
                  return false;
                }
                const receivedImageIds = new Set(correctedMessage.images.map((img) => img.imageId));
                return msg.imageIds.every((id) => receivedImageIds.has(id));
              }
              // 서버가 전송 직후 echo에는 images를 채워 보내지 않아(Gwangsan-Chatting-Server
              // chat.service.ts의 알려진 동작) 이미지 개수/ID로 대조할 수 없는 경우가 있다.
              // pendingMessages는 추가된 순서를 유지하므로 find()가 자연히 같은 방에서 가장
              // 먼저 보낸(=서버가 가장 먼저 처리했을) 이미지 메시지를 골라 FIFO로 매칭한다.
              return true;
            }
            return msg.content === correctedMessage.content;
          });

          // echo에 images가 비어있으면(위 서버 이슈) 그대로 캐시에 넣을 경우 사진이 안 보이는
          // 메시지가 되어, 방을 나갔다 REST로 다시 불러오기 전까진 화면에서 사라져 보인다.
          // pending에 들고 있던 로컬 미리보기 이미지를 그대로 채워 넣어 즉시 보이게 하고,
          // 실제 CDN URL은 다음 REST 갱신(재입장 등) 때 자연스럽게 대체된다.
          const messageToCache =
            matchingTemp &&
            correctedMessage.messageType === 'IMAGE' &&
            (!correctedMessage.images || correctedMessage.images.length === 0) &&
            matchingTemp.images?.length
              ? { ...correctedMessage, images: matchingTemp.images }
              : correctedMessage;

          queryClient.setQueryData(
            chatMessageQueryKey,
            (oldData: ChatMessageResponse[] | undefined) => {
              if (!oldData) return [messageToCache];

              const exists = oldData.some((msg) => msg.messageId === messageToCache.messageId);
              if (exists) return oldData;

              return [...oldData, messageToCache].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            }
          );

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
      if (data?.roomId == null) return;

      // 이 방을 지금 보고 있지 않아도(채팅 목록 화면이거나 다른 방을 보는 중이어도) 반영되어야 하므로
      // currentRoomId 일치 여부로 걸러내지 않는다.
      let patchedExistingProduct = false;
      queryClient.setQueryData<ChatRoomWithProduct>(['chatRoomData', data.roomId], (old) => {
        if (!old?.product) return old;
        patchedExistingProduct = true;
        return {
          ...old,
          product: {
            ...old.product,
            isCompleted: data.isCompleted,
            isCompletable:
              data.isCompletable ??
              (!data.isCompleted &&
                (data.requestedBySeller == null ||
                  data.requestedBySeller !== old.product.isSeller)),
            ...(typeof data.isReserved === 'boolean' ? { isReserved: data.isReserved } : {}),
            // 거래 취소 시 서버가 createdAt: null을 보내므로 무조건 대입해야 반영된다
            createdAt: data.createdAt ?? null,
          },
        };
      });

      // 이 방에 처음 생기는 거래 요청이면 payload만으로는 title/images 등을 채울 수 없어 위에서 patch가
      // 스킵된다 — 상대방이 방을 이미 열어둔 상태라면 30초 폴링을 기다리지 않고 바로 다시 받아온다.
      if (!patchedExistingProduct) {
        queryClient.invalidateQueries({ queryKey: ['chatRoomData', data.roomId] });
      }

      if (!chatRoomQueryKey) return;

      queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
        if (!oldData) return oldData;

        let hasChange = false;
        const nextData = oldData.map((room) => {
          if (room.roomId !== data.roomId || !room.product) return room;
          if (
            room.product.isCompleted === data.isCompleted &&
            (typeof data.isReserved !== 'boolean' || room.product.isReserved === data.isReserved)
          ) {
            return room;
          }

          hasChange = true;
          return {
            ...room,
            product: {
              ...room.product,
              isCompleted: data.isCompleted,
              ...(typeof data.isReserved === 'boolean' ? { isReserved: data.isReserved } : {}),
            },
          };
        });

        return hasChange ? nextData : oldData;
      });

      // 새로 생성된 거래 요청처럼 캐시에 없는 필드(title/images 등)는 목록을 다시 받아와 채운다.
      queryClient.invalidateQueries({ queryKey: chatRoomQueryKey });
    },
    [queryClient, chatRoomQueryKey]
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
