import { memo } from 'react';
import { useSigninCurrentStep } from '~/entity/auth/model/useAuthSelectors';
import { NicknameStep, PasswordStep } from '@/widget/signin';
import type { SigninState } from '~/entity/auth/model/authState';

const STEP_COMPONENTS: Record<SigninState['currentStep'], React.ComponentType> = {
  nickname: NicknameStep,
  password: PasswordStep,
} as const;

function SigninPageView(): React.ReactNode {
  const currentStep = useSigninCurrentStep();
  const StepComponent = STEP_COMPONENTS[currentStep];

  return <StepComponent />;
}

export default memo(SigninPageView);
