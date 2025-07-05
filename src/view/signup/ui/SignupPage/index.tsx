import { memo } from 'react';
import { useCurrentStep } from '~/entity/signup/model/useSignupSelectors';
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

const STEP_COMPONENTS = {
  name: NameStep,
  nickname: NicknameStep,
  password: PasswordStep,
  phone: PhoneStep,
  dong: DongStep,
  place: PlaceStep,
  specialties: SpecialtiesStep,
  recommender: RecommenderStep,
  complete: Complete,
} as const;

function SignupPageView(): React.ReactNode {
  const currentStep = useCurrentStep();
  const StepComponent = STEP_COMPONENTS[currentStep];

  return <StepComponent />;
}

export default memo(SignupPageView);
