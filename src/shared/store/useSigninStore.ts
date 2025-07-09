import { create } from 'zustand';
import { SigninState } from '~/entity/signup/model/authState';
import { getNextStep, getPrevStep } from '@/entity/signin/lib/getStep';

const INITIAL_FORM_DATA: SigninState['formData'] = {
  nickname: '',
  password: '',
};

export const useSigninStore = create<SigninState>((set) => ({
  currentStep: 'nickname' as SigninState['currentStep'],
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
  goToStep: (step: SigninState['currentStep']) => set({ currentStep: step }),
  resetStore: () =>
    set({
      currentStep: 'nickname',
      formData: INITIAL_FORM_DATA,
    }),
}));
