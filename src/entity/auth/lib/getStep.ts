type ResetPasswordStep = 'phoneNumber' | 'newPassword';

const RESET_PASSWORD_STEPS: readonly ResetPasswordStep[] = ['phoneNumber', 'newPassword'] as const;

const getStepIndexInternal = <T extends string>(step: T, steps: readonly T[]): number => {
  return steps.indexOf(step);
};

const getNextStepInternal = <T extends string>(currentStep: T, steps: readonly T[]): T => {
  const currentIndex = getStepIndexInternal(currentStep, steps);
  const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
  return steps[nextIndex];
};

const getPrevStepInternal = <T extends string>(currentStep: T, steps: readonly T[]): T => {
  const currentIndex = getStepIndexInternal(currentStep, steps);
  const prevIndex = Math.max(currentIndex - 1, 0);
  return steps[prevIndex];
};

export const getResetPasswordStepIndex = (step: ResetPasswordStep): number => {
  return getStepIndexInternal(step, RESET_PASSWORD_STEPS);
};

export const getNextResetPasswordStep = (currentStep: ResetPasswordStep): ResetPasswordStep => {
  return getNextStepInternal(currentStep, RESET_PASSWORD_STEPS);
};

export const getPrevResetPasswordStep = (currentStep: ResetPasswordStep): ResetPasswordStep => {
  return getPrevStepInternal(currentStep, RESET_PASSWORD_STEPS);
};
