import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useFindNicknamePhoneVerification } from '~/entity/auth/model/useFindNicknamePhoneVerification';
import { findNickname } from '~/entity/auth/api/findNickname';
import Toast from 'react-native-toast-message';
import FindNicknamePage from '../index';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/entity/auth/model/useFindNicknamePhoneVerification', () => ({
  useFindNicknamePhoneVerification: jest.fn(),
}));

jest.mock('~/entity/auth/api/findNickname', () => ({
  findNickname: jest.fn(),
}));

jest.mock('@/shared/assets/svg/BackArrow', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

const mockUseFindNicknamePhoneVerification = useFindNicknamePhoneVerification as jest.Mock;
const mockFindNickname = findNickname as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;

const makeHookReturn = (overrides = {}) => ({
  phoneNumber: '',
  verificationCode: '',
  phoneError: null,
  verificationError: null,
  verificationState: { isVerifying: false, isSendingCode: false, isVerifyingCode: false },
  handlePhoneChange: jest.fn(),
  handleVerificationChange: jest.fn(),
  handlePhoneSubmit: jest.fn(),
  handleVerificationSubmit: jest.fn(),
  requestVerification: jest.fn(),
  verifyCode: jest.fn(),
  buttonState: { isDisabled: false, text: '인증' },
  verifyButtonState: { isDisabled: false, text: '인증' },
  isVerificationComplete: false,
  verificationRef: { current: null },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseFindNicknamePhoneVerification.mockReturnValue(makeHookReturn());
});

describe('FindNicknamePage', () => {
  it('초기 화면에서 "별칭 찾기" 타이틀을 표시한다', () => {
    const { getAllByText } = render(<FindNicknamePage />);

    expect(getAllByText('별칭 찾기').length).toBeGreaterThanOrEqual(1);
  });

  it('인증 진행중이 아니면 인증번호 입력창을 표시하지 않는다', () => {
    const { queryByPlaceholderText } = render(<FindNicknamePage />);

    expect(queryByPlaceholderText('인증번호를 입력해주세요')).toBeNull();
  });

  it('isVerifying이 true이면 인증번호 입력창을 표시한다', () => {
    mockUseFindNicknamePhoneVerification.mockReturnValue(
      makeHookReturn({
        verificationState: { isVerifying: true, isSendingCode: false, isVerifyingCode: false },
      })
    );

    const { getByPlaceholderText } = render(<FindNicknamePage />);

    expect(getByPlaceholderText('인증번호를 입력해주세요')).toBeTruthy();
  });

  it('별칭 찾기 버튼은 인증 미완료 상태에서 비활성화되어 클릭해도 findNickname이 호출되지 않는다', () => {
    const { getAllByText } = render(<FindNicknamePage />);

    fireEvent.press(getAllByText('별칭 찾기')[1]);

    expect(mockFindNickname).not.toHaveBeenCalled();
  });

  it('별칭 찾기 성공 시 결과 화면으로 전환된다', async () => {
    mockUseFindNicknamePhoneVerification.mockReturnValue(
      makeHookReturn({ isVerificationComplete: true })
    );
    mockFindNickname.mockResolvedValue('테스트닉네임');

    const { getAllByText, getByText } = render(<FindNicknamePage />);

    fireEvent.press(getAllByText('별칭 찾기')[1]);

    await waitFor(() => expect(getByText('별칭 찾기 완료')).toBeTruthy());
    expect(getByText('테스트닉네임')).toBeTruthy();
  });

  it('별칭 찾기 실패 시 에러 토스트를 표시한다', async () => {
    mockUseFindNicknamePhoneVerification.mockReturnValue(
      makeHookReturn({ isVerificationComplete: true })
    );
    mockFindNickname.mockRejectedValue(new Error('별칭이 존재하지 않습니다.'));

    const { getAllByText } = render(<FindNicknamePage />);

    fireEvent.press(getAllByText('별칭 찾기')[1]);

    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text2: '별칭이 존재하지 않습니다.' })
      )
    );
  });

  it('뒤로 버튼 클릭 시 로그인 화면으로 이동한다', () => {
    const { getByText } = render(<FindNicknamePage />);

    fireEvent.press(getByText('뒤로'));

    expect(router.replace).toHaveBeenCalledWith('/signin');
  });

  it('완료 화면에서 로그인하러 가기 클릭 시 로그인 화면으로 이동한다', async () => {
    mockUseFindNicknamePhoneVerification.mockReturnValue(
      makeHookReturn({ isVerificationComplete: true })
    );
    mockFindNickname.mockResolvedValue('테스트닉네임');

    const { getAllByText, getByText } = render(<FindNicknamePage />);
    fireEvent.press(getAllByText('별칭 찾기')[1]);
    await waitFor(() => expect(getByText('로그인하러 가기')).toBeTruthy());

    fireEvent.press(getByText('로그인하러 가기'));

    expect(router.replace).toHaveBeenCalledWith('/signin');
  });
});
