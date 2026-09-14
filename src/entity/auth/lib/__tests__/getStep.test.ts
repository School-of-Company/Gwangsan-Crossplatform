import type { SignupStep } from '../../model/authState';
import {
  getSignupStepIndex,
  getNextSignupStep,
  getPrevSignupStep,
  getResetPasswordStepIndex,
  getNextResetPasswordStep,
  getPrevResetPasswordStep,
  getNextStep,
  getPrevStep,
} from '../getStep';

const SIGNUP_STEPS: SignupStep[] = [
  'terms',
  'name',
  'nickname',
  'password',
  'phoneNumber',
  'dongName',
  'placeName',
  'specialties',
  'description',
  'recommender',
  'complete',
];

describe('getSignupStepIndex', () => {
  it.each(SIGNUP_STEPS.map((step, idx) => [step, idx] as [SignupStep, number]))(
    '%s → %i',
    (step, expected) => {
      expect(getSignupStepIndex(step)).toBe(expected);
    }
  );
});

describe('getNextSignupStep', () => {
  it.each<[SignupStep, SignupStep]>([
    ['terms', 'name'],
    ['name', 'nickname'],
    ['nickname', 'password'],
    ['password', 'phoneNumber'],
    ['phoneNumber', 'dongName'],
    ['dongName', 'placeName'],
    ['placeName', 'specialties'],
    ['specialties', 'description'],
    ['description', 'recommender'],
    ['recommender', 'complete'],
  ])('%s → %s', (current, expected) => {
    expect(getNextSignupStep(current)).toBe(expected);
  });

  it('마지막 단계(complete)에서 next는 complete를 반환한다', () => {
    expect(getNextSignupStep('complete')).toBe('complete');
  });
});

describe('getPrevSignupStep', () => {
  it.each<[SignupStep, SignupStep]>([
    ['name', 'terms'],
    ['nickname', 'name'],
    ['password', 'nickname'],
    ['phoneNumber', 'password'],
    ['dongName', 'phoneNumber'],
    ['placeName', 'dongName'],
    ['specialties', 'placeName'],
    ['description', 'specialties'],
    ['recommender', 'description'],
    ['complete', 'recommender'],
  ])('%s → %s', (current, expected) => {
    expect(getPrevSignupStep(current)).toBe(expected);
  });

  it('첫 번째 단계(terms)에서 prev는 terms를 반환한다', () => {
    expect(getPrevSignupStep('terms')).toBe('terms');
  });
});

describe('getResetPasswordStepIndex', () => {
  it.each<[string, number]>([
    ['phoneNumber', 0],
    ['newPassword', 1],
  ])('%s → %i', (step, expected) => {
    expect(getResetPasswordStepIndex(step as 'phoneNumber' | 'newPassword')).toBe(expected);
  });
});

describe('getNextResetPasswordStep', () => {
  it('phoneNumber → newPassword', () => {
    expect(getNextResetPasswordStep('phoneNumber')).toBe('newPassword');
  });

  it('마지막 단계(newPassword)에서 next는 newPassword를 반환한다', () => {
    expect(getNextResetPasswordStep('newPassword')).toBe('newPassword');
  });
});

describe('getPrevResetPasswordStep', () => {
  it('newPassword → phoneNumber', () => {
    expect(getPrevResetPasswordStep('newPassword')).toBe('phoneNumber');
  });

  it('첫 번째 단계(phoneNumber)에서 prev는 phoneNumber를 반환한다', () => {
    expect(getPrevResetPasswordStep('phoneNumber')).toBe('phoneNumber');
  });
});

describe('getNextStep / getPrevStep (signup 별칭)', () => {
  it('getNextStep은 getNextSignupStep과 동일하게 동작한다', () => {
    SIGNUP_STEPS.forEach((step) => {
      expect(getNextStep(step)).toBe(getNextSignupStep(step));
    });
  });

  it('getPrevStep은 getPrevSignupStep과 동일하게 동작한다', () => {
    SIGNUP_STEPS.forEach((step) => {
      expect(getPrevStep(step)).toBe(getPrevSignupStep(step));
    });
  });
});
