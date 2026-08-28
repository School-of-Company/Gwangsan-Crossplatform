import { create } from 'zustand';

interface State {
  latitude: number | null;
  longitude: number | null;
  address: string;
  placeName: string;
  setCoordinates: (latitude: number, longitude: number, address: string) => void;
  setPlaceName: (placeName: string) => void;
  reset: () => void;
}

const initialState = {
  latitude: null,
  longitude: null,
  address: '',
  placeName: '',
};

export const useReservationLocationStore = create<State>()((set) => ({
  ...initialState,
  setCoordinates: (latitude, longitude, address) => set({ latitude, longitude, address }),
  setPlaceName: (placeName) => set({ placeName }),
  reset: () => set(initialState),
}));
