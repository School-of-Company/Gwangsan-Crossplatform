import { useSignupStore } from '@/entity/signup/model/signupStore';
import {
  NameStep,
  NicknameStep,
  PasswordStep,
  Complete,
  PhoneStep,
} from '@/widget/signup';

export default function SignupPageView() {
  const currentStep = useSignupStore((state) => state.currentStep);
  
  switch (currentStep) {
    case 'name':
      return <NameStep />;
    case 'nickname':
      return <NicknameStep />;
    case 'password':
      return <PasswordStep />;
    case 'phone':
      return <PhoneStep />;
    default:
      return <Complete />;
  }
}