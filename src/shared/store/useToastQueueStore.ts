import { create } from 'zustand';
import type { ToastType } from 'react-native-toast-message';

export interface QueuedToast {
  readonly id: number;
  readonly type: ToastType;
  readonly text1?: string;
  readonly text2?: string;
  readonly onPress?: () => void;
}

interface ToastQueueState {
  readonly toasts: readonly QueuedToast[];
  readonly push: (toast: Omit<QueuedToast, 'id'>) => number;
  readonly remove: (id: number) => void;
  readonly clear: () => void;
}

// 토스트가 화면 밖으로 넘치지 않도록 동시에 쌓일 수 있는 최대 개수를 제한한다
const MAX_VISIBLE_TOASTS = 4;

let nextToastId = 0;

export const useToastQueueStore = create<ToastQueueState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = ++nextToastId;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }].slice(-MAX_VISIBLE_TOASTS),
    }));
    return id;
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
