import { act, waitFor , renderHook } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { usePhoneVerification } from '../usePhoneVerification';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockSendSmsApi = jest.fn();
const mockVerifySmsApi = jest.fn();

const renderPhoneVerification = (overrides = {}) =>
  renderHook(() =>
    usePhoneVerification({
      sendSmsApi: mockSendSmsApi,
      verifySmsApi: mockVerifySmsApi,
      ...overrides,
    })
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePhoneVerification - 초기 상태', () => {
  it('기본값으로 초기화된다', () => {
    const { result } = renderPhoneVerification();

    expect(result.current.phoneNumber).toBe('');
    expect(result.current.verificationCode).toBe('');
    expect(result.current.phoneError).toBeNull();
    expect(result.current.verificationError).toBeNull();
    expect(result.current.isVerificationComplete).toBe(false);
    expect(result.current.verificationState.isVerifying).toBe(false);
    expect(result.current.verificationState.isSendingCode).toBe(false);
    expect(result.current.verificationState.isVerifyingCode).toBe(false);
  });

  it('initialPhoneNumber와 initialVerificationCode로 초기화된다', () => {
    const { result } = renderPhoneVerification({
      initialPhoneNumber: '01012345678',
      initialVerificationCode: '123456',
    });

    expect(result.current.phoneNumber).toBe('01012345678');
    expect(result.current.verificationCode).toBe('123456');
  });
});

describe('handlePhoneChange', () => {
  it('전화번호를 업데이트하고 에러와 인증 상태를 초기화한다', () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    expect(result.current.phoneNumber).toBe('01012345678');
    expect(result.current.phoneError).toBeNull();
    expect(result.current.isVerificationComplete).toBe(false);
    expect(result.current.verificationState.isVerifying).toBe(false);
  });
});

describe('handleVerificationChange', () => {
  it('인증번호를 업데이트하고 에러를 초기화한다', () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handleVerificationChange('654321');
    });

    expect(result.current.verificationCode).toBe('654321');
    expect(result.current.verificationError).toBeNull();
  });
});

describe('requestVerification', () => {
  it('유효한 전화번호로 SMS 전송 성공 시 isVerifying이 true가 된다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    expect(result.current.verificationState.isVerifying).toBe(true);
    expect(result.current.verificationState.isSendingCode).toBe(false);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '인증번호 전송 완료' })
    );
  });

  it('잘못된 전화번호(10자리)는 phoneError를 설정한다', async () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('0101234567');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    expect(result.current.phoneError).toBeTruthy();
    expect(mockSendSmsApi).not.toHaveBeenCalled();
  });

  it('전화번호 형식 오류(문자 포함)는 phoneError를 설정한다', async () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('0101234567a');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    expect(result.current.phoneError).toBeTruthy();
  });

  it('SMS 전송 API 실패 시 phoneError와 에러 토스트를 설정한다', async () => {
    mockSendSmsApi.mockRejectedValue(new Error('이미 가입된 번호'));

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    expect(result.current.phoneError).toBe('이미 가입된 번호');
    expect(result.current.verificationState.isSendingCode).toBe(false);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '인증번호 전송 실패' })
    );
  });

  it('SMS 전송 성공 후 타이머 실행으로 verificationRef.focus가 호출된다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    act(() => {
      jest.runAllTimers();
    });
  });
});

describe('verifyCode', () => {
  it('isVerifying이 false이면 phoneError를 설정하고 false를 반환한다', async () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handleVerificationChange('123456');
    });

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyCode();
    });

    expect(returnValue).toBe(false);
    expect(result.current.phoneError).toBe('인증을 먼저 진행해주세요');
  });

  it('빈 인증번호는 verificationError를 설정한다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    act(() => {
      result.current.handleVerificationChange('');
    });

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyCode();
    });

    expect(returnValue).toBe(false);
    expect(result.current.verificationError).toBeTruthy();
  });

  it('인증 성공 시 isVerified가 true가 되고 true를 반환한다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);
    mockVerifySmsApi.mockResolvedValue({ verified: true });

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
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

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyCode();
    });

    expect(returnValue).toBe(true);
    expect(result.current.isVerificationComplete).toBe(true);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '인증 완료' })
    );
  });

  it('인증 API 실패 시 verificationError와 에러 토스트를 설정하고 false를 반환한다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);
    mockVerifySmsApi.mockRejectedValue(new Error('인증번호가 틀렸습니다'));

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    act(() => {
      result.current.handleVerificationChange('000000');
    });

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.verifyCode();
    });

    expect(returnValue).toBe(false);
    expect(result.current.verificationError).toBe('인증번호가 틀렸습니다');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '인증 실패' })
    );
  });

  it('인증 API 호출 중 전화번호가 바뀌면 isVerified를 설정하지 않는다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);

    let resolveVerify!: () => void;
    mockVerifySmsApi.mockImplementation(() => new Promise<void>((res) => (resolveVerify = res)));

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
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

    act(() => {
      result.current.verifyCode();
    });

    act(() => {
      result.current.handlePhoneChange('01099998888');
    });

    await act(async () => {
      resolveVerify();
    });

    expect(result.current.isVerificationComplete).toBe(false);
  });
});

describe('handlePhoneSubmit', () => {
  it('전화번호가 11자리이면 requestVerification을 호출한다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      result.current.handlePhoneSubmit();
    });

    expect(mockSendSmsApi).toHaveBeenCalled();
  });

  it('전화번호가 11자리 미만이면 아무것도 하지 않는다', async () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('0101234');
    });

    await act(async () => {
      result.current.handlePhoneSubmit();
    });

    expect(mockSendSmsApi).not.toHaveBeenCalled();
  });
});

describe('handleVerificationSubmit', () => {
  it('인증번호가 있으면 verifyCode를 호출한다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);
    mockVerifySmsApi.mockResolvedValue({});

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
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
      result.current.handleVerificationSubmit();
    });

    expect(mockVerifySmsApi).toHaveBeenCalled();
  });

  it('인증번호가 빈 문자열이면 verifyCode를 호출하지 않는다', async () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    await act(async () => {
      result.current.handleVerificationSubmit();
    });

    expect(mockVerifySmsApi).not.toHaveBeenCalled();
  });
});

describe('buttonState', () => {
  it('전화번호가 11자리이면 버튼이 활성화된다', () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    expect(result.current.buttonState.isDisabled).toBe(false);
  });

  it('전화번호가 11자리 미만이면 버튼이 비활성화된다', () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('0101234');
    });

    expect(result.current.buttonState.isDisabled).toBe(true);
  });

  it('isVerifying이 false이면 버튼 텍스트는 "인증"이다', () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    expect(result.current.buttonState.text).toBe('인증');
  });

  it('SMS 전송 중이면 버튼 텍스트는 "전송중..."이다', async () => {
    let resolveApi!: () => void;
    mockSendSmsApi.mockImplementation(() => new Promise<void>((res) => (resolveApi = res)));

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    act(() => {
      result.current.requestVerification();
    });

    await waitFor(() => {
      expect(result.current.buttonState.text).toBe('전송중...');
    });

    act(() => resolveApi());
  });

  it('인증 진행 중이면 버튼 텍스트는 "재전송"이다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    expect(result.current.buttonState.text).toBe('재전송');
  });
});

describe('verifyButtonState', () => {
  it('인증번호가 없으면 비활성화된다', () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    expect(result.current.verifyButtonState.isDisabled).toBe(true);
  });

  it('인증번호가 있으면 활성화된다', () => {
    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handleVerificationChange('123456');
    });

    expect(result.current.verifyButtonState.isDisabled).toBe(false);
  });

  it('인증 완료 후 버튼 텍스트는 "인증완료"이다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);
    mockVerifySmsApi.mockResolvedValue({});

    const { result } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
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

    expect(result.current.verifyButtonState.text).toBe('인증완료');
    expect(result.current.verifyButtonState.isDisabled).toBe(true);
  });
});

describe('unmount cleanup', () => {
  it('언마운트 후 상태 업데이트를 시도하지 않는다', async () => {
    let resolveApi!: () => void;
    mockSendSmsApi.mockImplementation(() => new Promise<void>((res) => (resolveApi = res)));

    const { result, unmount } = renderHook(() =>
      usePhoneVerification({ sendSmsApi: mockSendSmsApi, verifySmsApi: mockVerifySmsApi })
    );

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    act(() => {
      result.current.requestVerification();
    });

    unmount();

    await act(async () => {
      resolveApi();
    });
  });

  it('SMS 성공 후 언마운트 시 타이머 콜백에서 focus를 호출하지 않는다', async () => {
    mockSendSmsApi.mockResolvedValue(undefined);

    const { result, unmount } = renderPhoneVerification();

    act(() => {
      result.current.handlePhoneChange('01012345678');
    });

    await act(async () => {
      await result.current.requestVerification();
    });

    unmount();

    act(() => {
      jest.runAllTimers();
    });
  });
});
