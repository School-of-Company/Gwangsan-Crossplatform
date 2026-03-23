export type SignupStep =
  | 'terms'
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

type ResetPasswordStep = 'phoneNumber' | 'newPassword';

export type SignupFormData = {
  name: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  phoneNumber: string;
  verificationCode: string;
  dongName: string;
  placeId: number;
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
};

export type ResetPasswordFormData = {
  phoneNumber: string;
  verificationCode: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export interface SignupState {
  currentStep: SignupStep;
  formData: SignupFormData;
  setField: <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SignupStep) => void;
  resetStore: () => void;
}

export interface SigninState {
  currentStep: SigninStep;
  formData: SigninFormData;
  setField: <K extends keyof SigninFormData>(field: K, value: SigninFormData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SigninStep) => void;
  resetStore: () => void;
}

export interface ResetPasswordState {
  currentStep: ResetPasswordStep;
  formData: ResetPasswordFormData;
  setField: (field: keyof ResetPasswordFormData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: ResetPasswordStep) => void;
  resetStore: () => void;
}
