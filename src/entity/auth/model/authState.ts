type SignupStep =
  | 'name'
  | 'nickname'
  | 'password'
  | 'phoneNumber'
  | 'dongName'
  | 'placeName'
  | 'specialties'
  | 'description'
  | 'recommender'
  | 'complete';

type SigninStep = 'nickname' | 'password';

export type SignupFormData = {
  name: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  phoneNumber: string;
  verificationCode: string;
  dongName: string;
  placeName: string;
  specialties: string[];
  description: string;
  recommender: string;
};

export type SigninFormData = {
  nickname: string;
  password: string;
  deviceToken: string;
  deviceId: string;
  osType: 'ANDROID' | 'IOS';
} & Readonly<Record<string, string>>;

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

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
