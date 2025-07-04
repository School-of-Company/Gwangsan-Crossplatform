import { useSignupStore } from '@/entity/signup/model/signupStore';
import {
  NameStep,
  NicknameStep,
  PasswordStep,
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
    default:
      return <NameStep />;
  }
}