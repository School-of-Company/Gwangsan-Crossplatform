import { create } from 'zustand';
import { ResetPasswordState } from '~/entity/auth/model/authState';
import { 
  getNextResetPasswordStep, 
  getPrevResetPasswordStep 
} from '~/entity/auth/lib/getStep';

const INITIAL_FORM_DATA: ResetPasswordState['formData'] = {
  phoneNumber: '',
  verificationCode: '',
  newPassword: '',
  newPasswordConfirm: '',
};

export const useResetPasswordStore = create<ResetPasswordState>((set) => ({
  currentStep: 'phoneNumber' as ResetPasswordState['currentStep'],
  formData: INITIAL_FORM_DATA,
  setField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),
  nextStep: () =>
    set((state) => ({
      currentStep: getNextResetPasswordStep(state.currentStep),
    })),
  prevStep: () =>
    set((state) => ({
      currentStep: getPrevResetPasswordStep(state.currentStep),
    })),
  goToStep: (step: ResetPasswordState['currentStep']) => set({ currentStep: step }),
  resetStore: () =>
    set({
      currentStep: 'phoneNumber',
      formData: INITIAL_FORM_DATA,
    }),
}));
