type SignupStep =
  | 'name'
  | 'nickname'
  | 'password'
  | 'phone'
  | 'dong'
  | 'place'
  | 'specialties'
  | 'recommender'
  | 'complete';

type SigninStep = 'nickname' | 'password';

export type SignupFormData = {
  name: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  verificationCode: string;
  dong: string;
  place: string;
  specialties: string[];
  recommender: string;
};

export type SigninFormData = {
  nickname: string;
  password: string;
} & Readonly<Record<string, string>>;

export interface SignupState {
  currentStep: SignupStep;
  formData: SignupFormData;
  setField: (field: string, value: string | string[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SignupStep) => void;
  resetStore: () => void;
}

export interface SigninState {
  currentStep: SigninStep;
  formData: SigninFormData;
  setField: (field: string, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SigninStep) => void;
  resetStore: () => void;
}
