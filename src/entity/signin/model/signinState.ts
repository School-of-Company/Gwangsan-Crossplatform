type SigninStep = 'nickname' | 'password';

export interface SigninState {
  currentStep: SigninStep;
  formData: {
    nickname: string;
    password: string;
  };
  setField: (field: string, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SigninStep) => void;
  resetStore: () => void;
}
