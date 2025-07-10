import { memo } from 'react';
import { useSignupCurrentStep } from '~/entity/auth/model/useAuthSelectors';
import {
  NameStep,
  NicknameStep,
  PasswordStep,
  Complete,
  PhoneStep,
  DongStep,
  PlaceStep,
  SpecialtiesStep,
  DescriptionStep,
  RecommenderStep,
} from '@/widget/signup';

const STEP_COMPONENTS = {
  name: NameStep,
  nickname: NicknameStep,
  password: PasswordStep,
  phoneNumber: PhoneStep,
  dongName: DongStep,
  placeName: PlaceStep,
  specialties: SpecialtiesStep,
  description: DescriptionStep,
  recommender: RecommenderStep,
  complete: Complete,
} as const;

function SignupPageView(): React.ReactNode {
  const currentStep = useSignupCurrentStep();
  const StepComponent = STEP_COMPONENTS[currentStep];

  return <StepComponent />;
}

export default memo(SignupPageView);
