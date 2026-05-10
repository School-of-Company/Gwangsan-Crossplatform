import { useEffect } from 'react';
import type { IChatSocketService } from '../lib/socketService';
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
  onTradeStatusUpdated?: (data: { roomId: number }) => void;
}

export const useSocketEventHandlers = ({
  socketService,
  onConnect,
  onReceiveMessage,
  onUpdateRoomList,
  onTradeStatusUpdated,
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

    if (onTradeStatusUpdated) {
      socketService.on('tradeStatusUpdated', onTradeStatusUpdated);
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

      if (onTradeStatusUpdated) {
        socketService.off('tradeStatusUpdated', onTradeStatusUpdated);
      }
    };
  }, [socketService, onConnect, onReceiveMessage, onUpdateRoomList, onTradeStatusUpdated]);
};
