import { create } from 'zustand';
import { Platform } from 'react-native';
import { SigninState } from '~/entity/auth/model/authState';

const INITIAL_FORM_DATA: SigninState['formData'] = {
  nickname: '',
  password: '',
  deviceToken: '',
  deviceId: '',
  osType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
};

export const useSigninStore = create<SigninState>((set) => ({
  formData: INITIAL_FORM_DATA,
  setField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),
  resetStore: () =>
    set({
      formData: INITIAL_FORM_DATA,
    }),
}));
