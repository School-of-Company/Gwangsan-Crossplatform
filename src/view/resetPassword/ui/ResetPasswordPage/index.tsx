import { memo } from 'react';
import { useResetPasswordCurrentStep } from '~/entity/auth/model/useAuthSelectors';
import { PhoneStep, NewPasswordStep } from '@/widget/resetPassword';
import type { ResetPasswordState } from '~/entity/auth/model/authState';

const STEP_COMPONENTS: Record<ResetPasswordState['currentStep'], React.ComponentType> = {
  phoneNumber: PhoneStep,
  newPassword: NewPasswordStep,
} as const;

function ResetPasswordPageView(): React.ReactNode {
  const currentStep = useResetPasswordCurrentStep();
  const StepComponent = STEP_COMPONENTS[currentStep];

  return <StepComponent />;
}

export default memo(ResetPasswordPageView);
