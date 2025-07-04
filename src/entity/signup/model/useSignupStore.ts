import { create } from 'zustand';
import { SignupState } from './signupState';

export const useSignupStore = create<SignupState>((set) => ({
  currentStep: 'name' as SignupState['currentStep'],
  formData: {
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
  } as SignupState['formData'],
  setField: (field, value) => 
    set((state) => ({
      formData: { ...state.formData, [field]: value }
    })),
  nextStep: () => set((state) => {
    const steps: SignupState['currentStep'][] = ['name', 'nickname', 'password', 'phone', 'dong', 'place', 'specialties', 'recommender'];
    const currentIndex = steps.indexOf(state.currentStep);
    const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
    return { currentStep: steps[nextIndex] };
  }),
  prevStep: () => set((state) => {
    const steps: SignupState['currentStep'][] = ['name', 'nickname', 'password', 'phone', 'dong', 'place', 'specialties', 'recommender'];
    const currentIndex = steps.indexOf(state.currentStep);
    const prevIndex = Math.max(currentIndex - 1, 0);
    return { currentStep: steps[prevIndex] };
  }),
  goToStep: (step: SignupState['currentStep']) => set({ currentStep: step }),
  resetStore: () => set({
    currentStep: 'name',
    formData: {
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
    }
  }),
}));