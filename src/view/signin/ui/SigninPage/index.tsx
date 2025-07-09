import { memo } from 'react';
import { useCurrentStep } from '~/entity/signin/model/useSigninSelectors';
import { NicknameStep, PasswordStep } from '@/widget/signin';
import type { SigninState } from '~/entity/signup/model/authState';

const STEP_COMPONENTS: Record<SigninState['currentStep'], React.ComponentType> = {
  nickname: NicknameStep,
  password: PasswordStep,
} as const;

function SigninPageView(): React.ReactNode {
  const currentStep = useCurrentStep();
  const StepComponent = STEP_COMPONENTS[currentStep];

  return <StepComponent />;
}

export default memo(SigninPageView);
