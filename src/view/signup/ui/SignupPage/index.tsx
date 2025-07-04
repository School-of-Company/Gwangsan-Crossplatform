import { useSignupStore } from '@/entity/signup/model/signupStore';
import {
  NameStep,
  NicknameStep,
} from '@/widget/signup';

export default function SignupPageView() {
  const currentStep = useSignupStore((state) => state.currentStep);
  
  switch (currentStep) {
    case 'name':
      return <NameStep />;
    case 'nickname':
      return <NicknameStep />;
    default:
      return <NameStep />;
  }
}