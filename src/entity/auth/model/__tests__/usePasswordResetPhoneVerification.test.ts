import { act, renderHook, waitFor } from '@testing-library/react-native';
import { sendPasswordResetSms } from '~/entity/auth/api/sendPasswordResetSms';
import { verifyPasswordResetSms } from '~/entity/auth/api/verifyPasswordResetSms';
import { usePasswordResetPhoneVerification } from '../usePasswordResetPhoneVerification';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));
jest.mock('~/entity/auth/api/sendPasswordResetSms', () => ({
  sendPasswordResetSms: jest.fn(),
}));
jest.mock('~/entity/auth/api/verifyPasswordResetSms', () => ({
  verifyPasswordResetSms: jest.fn(),
}));

const mockSend = sendPasswordResetSms as jest.Mock;
const mockVerify = verifyPasswordResetSms as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePasswordResetPhoneVerification', () => {
  it('initialPhoneNumber와 initialVerificationCode를 usePhoneVerification에 전달한다', () => {
    const { result } = renderHook(() =>
      usePasswordResetPhoneVerification({
        initialPhoneNumber: '01099998888',
        initialVerificationCode: '654321',
      })
    );

    expect(result.current.phoneNumber).toBe('01099998888');
    expect(result.current.verificationCode).toBe('654321');
    expect(typeof result.current.requestVerification).toBe('function');
    expect(typeof result.current.verifyCode).toBe('function');
  });

  it('기본값으로 초기화된다', () => {
    const { result } = renderHook(() => usePasswordResetPhoneVerification({}));

    expect(result.current.phoneNumber).toBe('');
    expect(result.current.verificationCode).toBe('');
  });

  it('verifyCode 호출 시 verifyPasswordResetSms를 실행한다', async () => {
    mockSend.mockResolvedValue(undefined);
    mockVerify.mockResolvedValue({});

    const { result } = renderHook(() =>
      usePasswordResetPhoneVerification({ initialPhoneNumber: '01012345678' })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    act(() => {
      result.current.handleVerificationChange('123456');
    });

    await act(async () => {
      await result.current.verifyCode();
    });

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith({ phoneNumber: '01012345678', code: '123456' });
    });
  });
});
