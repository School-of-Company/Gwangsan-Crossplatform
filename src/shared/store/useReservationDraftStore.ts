import { create } from 'zustand';

// 예약 날짜/시간/장소를 저장하는 서버 API가 아직 없어(Gwangsan-Server#357) 기기 로컬에만 보관한다.
// 상대방 기기에는 동기화되지 않으며, 백엔드 연동 시 이 store는 제거하고 서버 응답으로 대체한다.
export interface ReservationDraft {
  date: string;
  time: string;
  place: string;
}

interface ReservationDraftState {
  drafts: Record<number, ReservationDraft>;
  setDraft: (productId: number, draft: ReservationDraft) => void;
  clearDraft: (productId: number) => void;
  reset: () => void;
}

const initialState = { drafts: {} as Record<number, ReservationDraft> };

export const useReservationDraftStore = create<ReservationDraftState>()((set) => ({
  ...initialState,
  setDraft: (productId, draft) =>
    set((state) => ({ drafts: { ...state.drafts, [productId]: draft } })),
  clearDraft: (productId) =>
    set((state) => ({
      drafts: Object.fromEntries(
        Object.entries(state.drafts).filter(([key]) => Number(key) !== productId)
      ),
    })),
  reset: () => set(initialState),
}));
