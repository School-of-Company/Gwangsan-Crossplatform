import { create } from 'zustand';
import { SignupState } from '~/entity/auth/model/authState';
import { getNextStep, getPrevStep } from '~/entity/auth/lib/getStep';

const INITIAL_FORM_DATA: SignupState['formData'] = {
  name: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
  phone: '',
  verificationCode: '',
  dong: '',
  place: '',
  specialties: [],
  recommender: '',
};

export const useSignupStore = create<SignupState>((set) => ({
  currentStep: 'name' as SignupState['currentStep'],
  formData: INITIAL_FORM_DATA,
  setField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),
  nextStep: () =>
    set((state) => ({
      currentStep: getNextStep(state.currentStep),
    })),
  prevStep: () =>
    set((state) => ({
      currentStep: getPrevStep(state.currentStep),
    })),
  goToStep: (step: SignupState['currentStep']) => set({ currentStep: step }),
  resetStore: () =>
    set({
      currentStep: 'name',
      formData: INITIAL_FORM_DATA,
    }),
}));
