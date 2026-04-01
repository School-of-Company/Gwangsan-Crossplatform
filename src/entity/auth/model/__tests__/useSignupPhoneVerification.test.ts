import { renderHook } from '@testing-library/react-native';
import { useSignupPhoneVerification } from '../useSignupPhoneVerification';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));
jest.mock('~/entity/auth/api/sendSms', () => ({ sendSms: jest.fn() }));
jest.mock('~/entity/auth/api/verifySms', () => ({ verifySms: jest.fn() }));

describe('useSignupPhoneVerification', () => {
  it('initialPhoneNumber와 initialVerificationCode를 usePhoneVerification에 전달한다', () => {
    const { result } = renderHook(() =>
      useSignupPhoneVerification({
        initialPhoneNumber: '01012345678',
        initialVerificationCode: '123456',
      })
    );

    expect(result.current.phoneNumber).toBe('01012345678');
    expect(result.current.verificationCode).toBe('123456');
    expect(typeof result.current.requestVerification).toBe('function');
    expect(typeof result.current.verifyCode).toBe('function');
  });

  it('기본값으로 초기화된다', () => {
    const { result } = renderHook(() => useSignupPhoneVerification({}));

    expect(result.current.phoneNumber).toBe('');
    expect(result.current.verificationCode).toBe('');
  });
});
