import {
  getResetPasswordStepIndex,
  getNextResetPasswordStep,
  getPrevResetPasswordStep,
} from '../getStep';

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
