import type { SigninState } from '~/entity/signup/model/authState';

const SIGNIN_STEPS: readonly SigninState['currentStep'][] = ['nickname', 'password'] as const;

export const getStepIndex = (step: SigninState['currentStep']): number => {
  return SIGNIN_STEPS.indexOf(step);
};

export const getNextStep = (
  currentStep: SigninState['currentStep']
): SigninState['currentStep'] => {
  const currentIndex = getStepIndex(currentStep);
  const nextIndex = Math.min(currentIndex + 1, SIGNIN_STEPS.length - 1);
  return SIGNIN_STEPS[nextIndex];
};

export const getPrevStep = (
  currentStep: SigninState['currentStep']
): SigninState['currentStep'] => {
  const currentIndex = getStepIndex(currentStep);
  const prevIndex = Math.max(currentIndex - 1, 0);
  return SIGNIN_STEPS[prevIndex];
};
