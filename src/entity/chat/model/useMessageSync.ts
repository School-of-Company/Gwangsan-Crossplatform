import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
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

    if (currentRoomId && chatMessageQueryKey) {
      queryClient.invalidateQueries({ queryKey: chatMessageQueryKey });
    }
  }, [queryClient, chatRoomQueryKey, currentRoomId, chatMessageQueryKey]);

  const handleReceiveMessage = useCallback(
    async (message: ChatMessageResponse) => {
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
    [queryClient, currentRoomId, chatRoomQueryKey, chatMessageQueryKey]
  );

  const handleUpdateRoomList = useCallback(
    (data: {
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
    [queryClient, chatRoomQueryKey]
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
    handleConnect,
    handleReceiveMessage,
    handleUpdateRoomList,
    markRoomAsRead,
  };
};
