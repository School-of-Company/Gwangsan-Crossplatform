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
}

export const useSocketEventHandlers = ({
  socketService,
  onConnect,
  onReceiveMessage,
  onUpdateRoomList,
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
    };
  }, [socketService, onConnect, onReceiveMessage, onUpdateRoomList]);
}; 