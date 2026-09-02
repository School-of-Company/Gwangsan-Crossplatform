import { useEffect } from 'react';
import type {
  IChatSocketService,
  SocketErrorPayload,
  TransactionStateChangedPayload,
} from '../lib/socketService';
import type { ChatMessageResponse } from './chatTypes';

interface UseSocketEventHandlersProps {
  socketService: IChatSocketService;
  onConnect?: () => void;
  onReceiveMessage?: (message: ChatMessageResponse) => void;
  onUpdateRoomList?: (data: {
    roomId: number;
    lastMessage: string;
    lastMessageType: string;
    lastMessageTime: string;
  }) => void;
  onTransactionStateChanged?: (data: TransactionStateChangedPayload) => void;
  onError?: (error: SocketErrorPayload) => void;
}

export const useSocketEventHandlers = ({
  socketService,
  onConnect,
  onReceiveMessage,
  onUpdateRoomList,
  onTransactionStateChanged,
  onError,
}: UseSocketEventHandlersProps) => {
  useEffect(() => {
    if (onConnect) {
      socketService.on('connect', onConnect);
    }

    if (onReceiveMessage) {
      socketService.on('receiveMessage', onReceiveMessage);
    }

    if (onUpdateRoomList) {
      socketService.on('updateRoomList', onUpdateRoomList);
    }

    if (onTransactionStateChanged) {
      socketService.on('transactionStateChanged', onTransactionStateChanged);
    }

    if (onError) {
      socketService.on('error', onError);
    }

    return () => {
      if (onConnect) {
        socketService.off('connect', onConnect);
      }

      if (onReceiveMessage) {
        socketService.off('receiveMessage', onReceiveMessage);
      }

      if (onUpdateRoomList) {
        socketService.off('updateRoomList', onUpdateRoomList);
      }

      if (onTransactionStateChanged) {
        socketService.off('transactionStateChanged', onTransactionStateChanged);
      }

      if (onError) {
        socketService.off('error', onError);
      }
    };
  }, [
    socketService,
    onConnect,
    onReceiveMessage,
    onUpdateRoomList,
    onTransactionStateChanged,
    onError,
  ]);
};
