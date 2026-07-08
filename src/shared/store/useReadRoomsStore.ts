import { create } from 'zustand';
import type { RoomId, MessageId } from '~/shared/types/chatType';

interface ReadRoomsState {
  readMessageIds: Record<string, MessageId>;
  markRead: (roomId: RoomId, messageId: MessageId) => void;
  clearRead: (roomId: RoomId) => void;
  isRead: (roomId: RoomId, currentMessageId: MessageId) => boolean;
  reset: () => void;
}

export const useReadRoomsStore = create<ReadRoomsState>()((set, get) => ({
  readMessageIds: {},

  markRead: (roomId, messageId) => {
    set((state) => ({
      readMessageIds: { ...state.readMessageIds, [String(roomId)]: messageId },
    }));
  },

  clearRead: (roomId) => {
    set((state) => {
      if (!(String(roomId) in state.readMessageIds)) return state;
      const { [String(roomId)]: _removed, ...rest } = state.readMessageIds;
      return { readMessageIds: rest };
    });
  },

  isRead: (roomId, currentMessageId) => {
    const recorded = get().readMessageIds[String(roomId)];
    return recorded !== undefined && String(recorded) === String(currentMessageId);
  },

  reset: () => set({ readMessageIds: {} }),
}));
