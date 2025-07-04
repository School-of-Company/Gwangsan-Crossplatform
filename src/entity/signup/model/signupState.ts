type SignupStep = 
  | 'name' 
  | 'nickname' 
  | 'password' 
  | 'phone' 
  | 'location' 
  | 'branch' 
  | 'introduction' 
  | 'referral';

export interface SignupState {
  currentStep: SignupStep;
  formData: {
    name: string;
    nickname: string;
    password: string;
    passwordConfirm: string;
    phone: string;
    verificationCode: string;
    location: string;
    branch: string;
    introduction: string;
    referral: string;
  };
  setField: (field: string, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SignupStep) => void;
}