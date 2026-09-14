import { create } from 'zustand';
import { SignupState } from '~/entity/auth/model/authState';

const INITIAL_FORM_DATA: SignupState['formData'] = {
  name: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
  phoneNumber: '',
  verificationCode: '',
  dongName: '',
  placeId: 0,
  specialties: [],
  description: '',
  recommender: '',
};

export const useSignupStore = create<SignupState>((set) => ({
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
