import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import {
  NameStep,
  NicknameStep,
  PasswordStep,
  Complete,
  PhoneStep,
  DongStep,
  PlaceStep,
  SpecialtiesStep,
  RecommenderStep,
} from '@/widget/signup';

export default function SignupPageView(): React.ReactNode {
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
    case 'dong':
      return <DongStep />;
    case 'place':
      return <PlaceStep />;
    case 'specialties':
      return <SpecialtiesStep />;
    case 'recommender':
      return <RecommenderStep />;
    default:
      return <Complete />;
  }
}