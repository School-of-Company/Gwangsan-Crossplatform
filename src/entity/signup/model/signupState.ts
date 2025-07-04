type SignupStep = 
  | 'name' 
  | 'nickname' 
  | 'password' 
  | 'phone' 
  | 'dong' 
  | 'place' 
  | 'specialties'
  | 'recommender';

export interface SignupState {
  currentStep: SignupStep;
  formData: {
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
  setField: (field: string, value: string | string[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SignupStep) => void;
}