import { create } from 'zustand';
import type { RoomId, MessageType } from '~/shared/types/chatType';

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type MessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];

export interface PendingMessage {
  tempId: string;
  roomId: RoomId;
  content: string | null;
  messageType: MessageType;
  imageIds: number[];
  status: MessageStatus;
  createdAt: string;
  retryCount: number;
}

interface ChatQueueState {
  pendingMessages: PendingMessage[];
  addMessage: (message: Omit<PendingMessage, 'tempId' | 'status' | 'createdAt' | 'retryCount'>) => string;
  setStatus: (tempId: string, status: MessageStatus) => void;
  removeMessage: (tempId: string) => void;
  retry: (tempId: string) => void;
  getByRoom: (roomId: RoomId) => PendingMessage[];
  getRetryable: (roomId: RoomId) => PendingMessage[];
}

const uuid = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useChatQueueStore = create<ChatQueueState>((set, get) => ({
  pendingMessages: [],

  addMessage: (message) => {
    const tempId = uuid();
    const newMessage: PendingMessage = {
      ...message,
      tempId,
      status: MESSAGE_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    set((state) => ({ pendingMessages: [...state.pendingMessages, newMessage] }));
    return tempId;
  },

  setStatus: (tempId, status) => {
    set((state) => ({
      pendingMessages: state.pendingMessages.map((msg) =>
        msg.tempId === tempId ? { ...msg, status } : msg
      ),
    }));
  },

  removeMessage: (tempId) => {
    set((state) => ({
      pendingMessages: state.pendingMessages.filter((msg) => msg.tempId !== tempId),
    }));
  },

  retry: (tempId) => {
    set((state) => ({
      pendingMessages: state.pendingMessages.map((msg) =>
        msg.tempId === tempId
          ? { ...msg, retryCount: msg.retryCount + 1, status: MESSAGE_STATUS.PENDING }
          : msg
      ),
    }));
  },

  getByRoom: (roomId) => {
    return get().pendingMessages.filter((msg) => msg.roomId === roomId);
  },

  getRetryable: (roomId) => {
    return get().pendingMessages.filter(
      (msg) =>
        msg.roomId === roomId &&
        (msg.status === MESSAGE_STATUS.PENDING || msg.status === MESSAGE_STATUS.FAILED)
    );
  },
}));

