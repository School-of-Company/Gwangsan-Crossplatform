import { act, renderHook, waitFor } from '@testing-library/react-native';
import { sendFindNicknameSms } from '~/entity/auth/api/sendFindNicknameSms';
import { verifyFindNicknameSms } from '~/entity/auth/api/verifyFindNicknameSms';
import { useFindNicknamePhoneVerification } from '../useFindNicknamePhoneVerification';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));
jest.mock('~/entity/auth/api/sendFindNicknameSms', () => ({
  sendFindNicknameSms: jest.fn(),
}));
jest.mock('~/entity/auth/api/verifyFindNicknameSms', () => ({
  verifyFindNicknameSms: jest.fn(),
}));

const mockSend = sendFindNicknameSms as jest.Mock;
const mockVerify = verifyFindNicknameSms as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useFindNicknamePhoneVerification', () => {
  it('기본값으로 초기화된다', () => {
    const { result } = renderHook(() => useFindNicknamePhoneVerification());

    expect(result.current.phoneNumber).toBe('');
    expect(result.current.verificationCode).toBe('');
    expect(typeof result.current.requestVerification).toBe('function');
    expect(typeof result.current.verifyCode).toBe('function');
  });

  it('requestVerification 호출 시 sendFindNicknameSms를 실행한다', async () => {
    mockSend.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFindNicknamePhoneVerification());

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    expect(mockSend).toHaveBeenCalledWith('01012345678');
  });

  it('verifyCode 호출 시 verifyFindNicknameSms를 실행한다', async () => {
    mockSend.mockResolvedValue(undefined);
    mockVerify.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFindNicknamePhoneVerification());

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
      expect(mockVerify).toHaveBeenCalledWith('01012345678', '123456');
    });
  });
});
