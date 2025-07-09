type SignupStep =
  | 'name'
  | 'nickname'
  | 'password'
  | 'phone'
  | 'dong'
  | 'place'
  | 'specialties'
  | 'recommender'
  | 'complete';

type SigninStep = 'nickname' | 'password';

const SIGNUP_STEPS: readonly SignupStep[] = [
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

const SIGNIN_STEPS: readonly SigninStep[] = ['nickname', 'password'] as const;

const getStepIndexInternal = <T extends string>(
  step: T,
  steps: readonly T[]
): number => {
  return steps.indexOf(step);
};

const getNextStepInternal = <T extends string>(
  currentStep: T,
  steps: readonly T[]
): T => {
  const currentIndex = getStepIndexInternal(currentStep, steps);
  const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
  return steps[nextIndex];
};

const getPrevStepInternal = <T extends string>(
  currentStep: T,
  steps: readonly T[]
): T => {
  const currentIndex = getStepIndexInternal(currentStep, steps);
  const prevIndex = Math.max(currentIndex - 1, 0);
  return steps[prevIndex];
};

export const getSignupStepIndex = (step: SignupStep): number => {
  return getStepIndexInternal(step, SIGNUP_STEPS);
};

export const getNextSignupStep = (currentStep: SignupStep): SignupStep => {
  return getNextStepInternal(currentStep, SIGNUP_STEPS);
};

export const getPrevSignupStep = (currentStep: SignupStep): SignupStep => {
  return getPrevStepInternal(currentStep, SIGNUP_STEPS);
};

export const getSigninStepIndex = (step: SigninStep): number => {
  return getStepIndexInternal(step, SIGNIN_STEPS);
};

export const getNextSigninStep = (currentStep: SigninStep): SigninStep => {
  return getNextStepInternal(currentStep, SIGNIN_STEPS);
};

export const getPrevSigninStep = (currentStep: SigninStep): SigninStep => {
  return getPrevStepInternal(currentStep, SIGNIN_STEPS);
};

export const getNextStep = getNextSignupStep;
export const getPrevStep = getPrevSignupStep;
