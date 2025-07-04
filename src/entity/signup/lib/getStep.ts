import type { SignupState } from '~/entity/signup/model/signupState';

const SIGNUP_STEPS: readonly SignupState['currentStep'][] = [
  'name',
  'nickname',
  'password',
  'phone',
  'dong',
  'place',
  'specialties',
  'recommender',
  'complete',
] as const;

export const getStepIndex = (step: SignupState['currentStep']): number => {
  return SIGNUP_STEPS.indexOf(step);
};

export const getNextStep = (
  currentStep: SignupState['currentStep']
): SignupState['currentStep'] => {
  const currentIndex = getStepIndex(currentStep);
  const nextIndex = Math.min(currentIndex + 1, SIGNUP_STEPS.length - 1);
  return SIGNUP_STEPS[nextIndex];
};

export const getPrevStep = (
  currentStep: SignupState['currentStep']
): SignupState['currentStep'] => {
  const currentIndex = getStepIndex(currentStep);
  const prevIndex = Math.max(currentIndex - 1, 0);
  return SIGNUP_STEPS[prevIndex];
};
