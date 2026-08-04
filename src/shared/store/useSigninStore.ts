import { create } from 'zustand';
import { Platform } from 'react-native';
import { SigninState } from '~/entity/auth/model/authState';
import {
  getNextSigninStep,
  getPrevSigninStep,
  getSigninStepIndex,
} from '~/entity/auth/lib/getStep';

const INITIAL_FORM_DATA: SigninState['formData'] = {
  nickname: '',
  password: '',
  deviceToken: '',
  deviceId: '',
  osType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
};

export const useSigninStore = create<SigninState>((set) => ({
  currentStep: 'nickname' as SigninState['currentStep'],
  direction: null,
  formData: INITIAL_FORM_DATA,
  setField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),
  nextStep: () =>
    set((state) => ({
      currentStep: getNextSigninStep(state.currentStep),
      direction: 'right',
    })),
  prevStep: () =>
    set((state) => ({
      currentStep: getPrevSigninStep(state.currentStep),
      direction: 'left',
    })),
  goToStep: (step: SigninState['currentStep']) =>
    set((state) => ({
      currentStep: step,
      direction:
        getSigninStepIndex(step) > getSigninStepIndex(state.currentStep) ? 'right' : 'left',
    })),
  resetStore: () =>
    set({
      currentStep: 'nickname',
      direction: null,
      formData: INITIAL_FORM_DATA,
    }),
}));
