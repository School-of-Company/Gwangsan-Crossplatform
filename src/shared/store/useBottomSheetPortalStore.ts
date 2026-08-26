import { create } from 'zustand';
import type { ReactNode } from 'react';

interface State {
  sheets: Record<string, ReactNode>;
  setSheet: (id: string, node: ReactNode) => void;
  removeSheet: (id: string) => void;
  reset: () => void;
}

const initialState = { sheets: {} };

export const useBottomSheetPortalStore = create<State>()((set) => ({
  ...initialState,
  setSheet: (id, node) => set((state) => ({ sheets: { ...state.sheets, [id]: node } })),
  removeSheet: (id) =>
    set((state) => {
      if (!(id in state.sheets)) return state;
      const rest = { ...state.sheets };
      delete rest[id];
      return { sheets: rest };
    }),
  reset: () => set(initialState),
}));
