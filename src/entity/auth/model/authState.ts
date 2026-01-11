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
} & Readonly<Record<string, string>>;

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

export interface ResetPasswordState {
  currentStep: ResetPasswordStep;
  formData: ResetPasswordFormData;
  setField: (field: keyof ResetPasswordFormData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: ResetPasswordStep) => void;
  resetStore: () => void;
}
