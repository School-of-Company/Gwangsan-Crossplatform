import { create } from 'zustand';

interface State {
  isHidden: boolean;
  hide: () => void;
  show: () => void;
  reset: () => void;
}

const initialState = { isHidden: false };

export const useFooterVisibilityStore = create<State>()((set) => ({
  ...initialState,
  hide: () => set({ isHidden: true }),
  show: () => set({ isHidden: false }),
  reset: () => set(initialState),
}));
