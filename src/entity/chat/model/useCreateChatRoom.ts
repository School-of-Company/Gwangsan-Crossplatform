import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { createChatRoom } from '../api/createChatRoom';
import { chatRoomKeys } from './useChatRooms';
import type { CreateChatRoomResponse, ChatApiError } from './chatTypes';
import type { ProductId } from '@/shared/types/chatType';

interface UseCreateChatRoomParams {
  onSuccess?: (data: CreateChatRoomResponse) => void;
  onError?: (error: ChatApiError) => void;
}

export const useCreateChatRoom = ({ onSuccess, onError }: UseCreateChatRoomParams = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (productId: ProductId) => createChatRoom(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: chatRoomKeys.list(),
      });

      Toast.show({
        type: 'success',
        text1: '채팅방 생성 완료',
        text2: '채팅을 시작할 수 있습니다.',
        visibilityTime: 2000,
      });

      onSuccess?.(data);
    },
    onError: (error: ChatApiError) => {
      Toast.show({
        type: 'error',
        text1: '채팅방 생성 실패',
        text2: error.message,
        visibilityTime: 3000,
      });

      onError?.(error);
    },
  });

  const createRoom = useCallback(
    (productId: ProductId) => {
      return mutation.mutate(productId);
    },
    [mutation]
  );

  return {
    ...mutation,
    createRoom,
  };
};
