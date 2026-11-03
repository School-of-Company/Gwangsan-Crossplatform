import { create } from 'zustand';
import type { ReactNode } from 'react';

interface State {
  sheets: Record<string, ReactNode>;
  // 열려 있는 시트를 닫는 콜백. 화면을 벗어날 때 남은 시트를 한꺼번에 닫는 데 쓴다
  closers: Record<string, () => void>;
  setSheet: (id: string, node: ReactNode) => void;
  removeSheet: (id: string) => void;
  setCloser: (id: string, close: (() => void) | null) => void;
  closeAll: () => void;
  reset: () => void;
}

const initialState = { sheets: {}, closers: {} };

const without = <T>(record: Record<string, T>, id: string): Record<string, T> => {
  const rest = { ...record };
  delete rest[id];
  return rest;
};

export const useBottomSheetPortalStore = create<State>()((set, get) => ({
  ...initialState,
  setSheet: (id, node) => set((state) => ({ sheets: { ...state.sheets, [id]: node } })),
  removeSheet: (id) =>
    set((state) => {
      if (!(id in state.sheets) && !(id in state.closers)) return state;
      return { sheets: without(state.sheets, id), closers: without(state.closers, id) };
    }),
  setCloser: (id, close) =>
    set((state) => {
      if (close) return { closers: { ...state.closers, [id]: close } };
      if (!(id in state.closers)) return state;
      return { closers: without(state.closers, id) };
    }),
  closeAll: () => {
    Object.values(get().closers).forEach((close) => close());
  },
  reset: () => set(initialState),
}));
