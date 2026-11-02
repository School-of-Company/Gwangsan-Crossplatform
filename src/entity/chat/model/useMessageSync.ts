import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markChatAsRead } from '../api/markChatAsRead';
import { useChatQueueStore } from '~/shared/store/useChatQueueStore';
import { useReadRoomsStore } from '~/shared/store/useReadRoomsStore';
import type { ChatMessageResponse, ChatRoomListItem, ChatRoomWithProduct } from './chatTypes';
import type { RoomId } from '@/shared/types/chatType';
import { chatMessageKeys, chatRoomDataKeys } from './chatQueryKeys';
import { logger } from '~/shared/lib/logger';
import { profileQueryKeys } from '~/shared/model/profileQueryKeys';
import { isSystemMessage } from '../lib/messagePolicy';
import { matchPendingEcho } from '../lib/pendingEcho';
import type { TransactionStateChangedPayload } from '../lib/socketService';
import {
  addMessageToPages,
  applyMessageUpdate,
  getNewestMessage,
  isSameMessageId,
  mapMessagePages,
  removeMessageById,
  type ChatMessagePages,
  type MessageDeletedPayload,
  type MessageUpdatedPayload,
} from '../lib/messageCache';

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
    if (currentRoomId !== undefined) {
      queryClient.invalidateQueries({ queryKey: chatRoomDataKeys.room(currentRoomId) });
      // 끊긴 동안 놓친 메시지를 채운다. 무한 쿼리 재조회는 최신 페이지부터 새 커서로 이어 받으므로
      // 놓친 메시지가 한 페이지보다 많아도 중간이 비지 않는다
      queryClient.invalidateQueries({ queryKey: chatMessageKeys.room(currentRoomId) });
    }
  }, [queryClient, chatRoomQueryKey, currentRoomId]);

  const processMessage = useCallback(
    (message: ChatMessageResponse) => {
      try {
        // isMine은 서버가 발신자 기준으로 계산한 값을 그대로 쓴다(로컬 세션으로 재계산하면 캐시 타이밍에 따라 뒤집힌다)
        const isCurrentRoomMessage = currentRoomId && message.roomId === currentRoomId;

        if (isCurrentRoomMessage && !message.isMine) {
          useReadRoomsStore.getState().markRead(message.roomId, message.messageId);
          markChatAsRead(message.roomId, message.messageId).catch((error) => {
            logger.error('markChatAsRead (auto) failed', error);
          });
        }

        // 이 방을 지금 보고 있지 않아도 echo가 오면 pending 큐 확정·캐시 반영은 항상 해야 한다
        {
          const targetMessageQueryKey = chatMessageKeys.room(message.roomId);
          const queueState = useChatQueueStore.getState();
          const matchingTemp = matchPendingEcho(queueState.pendingMessages, message);

          // echo에 images가 비어있으면(위 서버 이슈) 그대로 캐시에 넣을 경우 사진이 안 보이는
          // 메시지가 되어, 방을 나갔다 REST로 다시 불러오기 전까진 화면에서 사라져 보인다.
          // pending에 들고 있던 로컬 미리보기 이미지를 그대로 채워 넣어 즉시 보이게 하고,
          // 실제 CDN URL은 다음 REST 갱신(재입장 등) 때 자연스럽게 대체된다.
          const messageToCache =
            matchingTemp &&
            message.messageType === 'IMAGE' &&
            (!message.images || message.images.length === 0) &&
            matchingTemp.images?.length
              ? { ...message, images: matchingTemp.images }
              : message;

          queryClient.setQueryData<ChatMessagePages>(targetMessageQueryKey, (oldData) =>
            addMessageToPages(oldData, messageToCache)
          );

          if (matchingTemp) {
            queueState.removeMessage(matchingTemp.tempId);
          }
        }

        if (chatRoomQueryKey) {
          queryClient.setQueryData(chatRoomQueryKey, (oldData: ChatRoomListItem[] | undefined) => {
            if (!oldData) return oldData;

            return oldData.map((room) => {
              if (room.roomId !== message.roomId) return room;
              if (room.messageId === message.messageId) return room;

              const incomingTime = new Date(message.createdAt).getTime();
              const lastTime = new Date(room.lastMessageTime).getTime();
              const isStale = Number.isFinite(lastTime) && incomingTime < lastTime;
              if (isStale) return room;

              const isActiveRoom = room.roomId === currentRoomId;
              // SYSTEM 메시지는 상대가 보낸 대화가 아니므로 안 읽은 수를 늘리지 않는다
              const nextUnreadCount = isActiveRoom
                ? 0
                : message.isMine || isSystemMessage(message)
                  ? room.unreadMessageCount
                  : room.unreadMessageCount + 1;

              return {
                ...room,
                messageId: message.messageId,
                lastMessage: message.content || '(사진)',
                lastMessageType: message.messageType,
                lastMessageTime: message.createdAt,
                unreadMessageCount: nextUnreadCount,
              };
            });
          });
        }
      } catch (error) {
        logger.error('handleReceiveMessage error', error);
      }
    },
    [queryClient, currentRoomId, chatRoomQueryKey]
  );

  const handleReceiveMessage = useCallback(
    (message: ChatMessageResponse) => {
      if (!message || typeof message !== 'object') return;

      processMessage(message);
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
      let reservationChanged = false;
      queryClient.setQueryData<ChatRoomWithProduct>(chatRoomDataKeys.room(data.roomId), (old) => {
        if (!old?.product) return old;
        patchedExistingProduct = true;
        reservationChanged =
          typeof data.isReserved === 'boolean' && data.isReserved !== old.product.isReserved;
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
      // 예약 상태가 바뀐 경우도 payload에는 예약 일시·장소·reservedAt이 없어, 그대로 두면 상대방 화면의
      // 예약 카드가 내용 없이 그려진다 — 방 데이터를 다시 받아와 채운다.
      if (!patchedExistingProduct || reservationChanged) {
        queryClient.invalidateQueries({ queryKey: chatRoomDataKeys.room(data.roomId) });
      }

      // 상대가 거래를 확정해도 내 광산이 바뀌므로, 5분 캐시된 내 프로필과 홈 화면 광산 배너
      // (myInformation)를 바로 다시 받아온다
      if (data.isCompleted) {
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.myProfile() });
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.myInformation() });
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

  // 상대방(또는 내 다른 기기)이 메시지를 수정하면 이 방을 보고 있지 않아도 캐시를 맞춰 둔다
  const handleMessageUpdated = useCallback(
    (data: MessageUpdatedPayload) => {
      if (data?.roomId == null || data.messageId == null) return;

      queryClient.setQueryData<ChatMessagePages>(chatMessageKeys.room(data.roomId), (old) =>
        mapMessagePages(old, (messages) => applyMessageUpdate(messages, data))
      );

      if (!chatRoomQueryKey) return;
      queryClient.setQueryData<ChatRoomListItem[]>(chatRoomQueryKey, (old) =>
        old?.map((room) =>
          room.roomId === data.roomId && isSameMessageId(room.messageId, data.messageId)
            ? { ...room, lastMessage: data.content }
            : room
        )
      );
    },
    [queryClient, chatRoomQueryKey]
  );

  // 삭제된 메시지는 흔적 없이 양쪽 화면에서 사라져야 한다
  const handleMessageDeleted = useCallback(
    (data: MessageDeletedPayload) => {
      if (data?.roomId == null || data.messageId == null) return;

      queryClient.setQueryData<ChatMessagePages>(chatMessageKeys.room(data.roomId), (old) =>
        mapMessagePages(old, (messages) => removeMessageById(messages, data.messageId))
      );

      if (!chatRoomQueryKey) return;
      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(chatRoomQueryKey);
      const isLastMessage = rooms?.some(
        (room) => room.roomId === data.roomId && isSameMessageId(room.messageId, data.messageId)
      );
      // 마지막 메시지가 지워지면 그 이전 메시지는 캐시만으로 알 수 없어 목록을 다시 받아온다
      if (isLastMessage) {
        queryClient.invalidateQueries({ queryKey: chatRoomQueryKey });
      }
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

      const lastMessage = getNewestMessage(
        queryClient.getQueryData<ChatMessagePages>(
          chatMessageQueryKey ?? chatMessageKeys.room(roomId)
        )
      );

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
    handleMessageUpdated,
    handleMessageDeleted,
    markRoomAsRead,
  };
};
