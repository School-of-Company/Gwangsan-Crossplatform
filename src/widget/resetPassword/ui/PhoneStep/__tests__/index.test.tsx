import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import {
  useResetPasswordFormField,
  useResetPasswordStepNavigation,
} from '~/entity/auth/model/useAuthSelectors';
import { usePasswordResetPhoneVerification } from '~/entity/auth/model/usePasswordResetPhoneVerification';
import PhoneStep from '../index';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useResetPasswordFormField: jest.fn(),
  useResetPasswordStepNavigation: jest.fn(),
}));

jest.mock('~/entity/auth/model/usePasswordResetPhoneVerification', () => ({
  usePasswordResetPhoneVerification: jest.fn(),
}));

jest.mock('@/shared/ui/Input', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: React.forwardRef(
      ({ testID, value, onChangeText, onSubmitEditing, label }: any, ref: any) =>
        React.createElement(TextInput, {
          testID: testID || label,
          value,
          onChangeText,
          onSubmitEditing,
          ref,
        })
    ),
  };
});

jest.mock('@/shared/ui/Button', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Button: ({ children, onPress, disabled, testID }: any) =>
      React.createElement(
        TouchableOpacity,
        {
          testID: testID || `button-${children}`,
          onPress,
          disabled,
          accessibilityState: { disabled: !!disabled },
        },
        React.createElement(Text, null, children)
      ),
  };
});

jest.mock('@/shared/ui/ErrorMessage', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ErrorMessage: ({ error }: any) =>
      error ? React.createElement(Text, { testID: 'error-message' }, error) : null,
  };
});

jest.mock('~/entity/auth/ui/ResetPasswordForm', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, onNext, onBack, title, description, isNextDisabled }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description),
        children,
        React.createElement(
          TouchableOpacity,
          { testID: 'next-button', onPress: onNext, disabled: isNextDisabled },
          React.createElement(Text, null, '다음')
        ),
        React.createElement(
          TouchableOpacity,
          { testID: 'back-button', onPress: onBack },
          React.createElement(Text, null, '뒤로')
        )
      ),
  };
});

const mockUseResetPasswordFormField = useResetPasswordFormField as jest.Mock;
const mockUseResetPasswordStepNavigation = useResetPasswordStepNavigation as jest.Mock;
const mockUsePasswordResetPhoneVerification = usePasswordResetPhoneVerification as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

const mockUpdatePhoneNumber = jest.fn();
const mockUpdateVerificationCode = jest.fn();
const mockNextStep = jest.fn();
const mockResetStore = jest.fn();
const mockRequestVerification = jest.fn();
const mockVerifyCode = jest.fn();
const mockHandlePhoneChange = jest.fn();
const mockHandleVerificationChange = jest.fn();
const mockHandlePhoneSubmit = jest.fn();
const mockHandleVerificationSubmit = jest.fn();

const makePhoneVerificationReturn = (overrides = {}) => ({
  phoneNumber: '',
  verificationCode: '',
  phoneError: null,
  verificationError: null,
  verificationState: { isVerifying: false, isSendingCode: false, isVerifyingCode: false },
  handlePhoneChange: mockHandlePhoneChange,
  handleVerificationChange: mockHandleVerificationChange,
  handlePhoneSubmit: mockHandlePhoneSubmit,
  handleVerificationSubmit: mockHandleVerificationSubmit,
  requestVerification: mockRequestVerification,
  verifyCode: mockVerifyCode,
  buttonState: { isDisabled: false, text: '인증' },
  verifyButtonState: { isDisabled: false, text: '인증' },
  isVerificationComplete: false,
  verificationRef: { current: null },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();

  mockUseResetPasswordFormField.mockImplementation((field: string) => {
    if (field === 'phoneNumber') {
      return { value: '', updateField: mockUpdatePhoneNumber };
    }
    return { value: '', updateField: mockUpdateVerificationCode };
  });
  mockUseResetPasswordStepNavigation.mockReturnValue({
    nextStep: mockNextStep,
    resetStore: mockResetStore,
  });
  mockUsePasswordResetPhoneVerification.mockReturnValue(makePhoneVerificationReturn());
});

describe('PhoneStep — 렌더링', () => {
  it('제목과 설명을 렌더링한다', () => {
    const { getByText } = render(<PhoneStep />);

    expect(getByText('비밀번호 재설정')).toBeTruthy();
    expect(getByText('가입 시 등록한 전화번호를 입력해주세요')).toBeTruthy();
  });

  it('인증 진행 중이 아니면 인증번호 입력란을 표시하지 않는다', () => {
    const { queryByText } = render(<PhoneStep />);

    expect(queryByText('인증완료')).toBeNull();
  });

  it('인증 진행 중이면 인증번호 입력란을 표시한다', () => {
    mockUsePasswordResetPhoneVerification.mockReturnValue(
      makePhoneVerificationReturn({
        verificationState: { isVerifying: true, isSendingCode: false, isVerifyingCode: false },
      })
    );

    const { getByTestId } = render(<PhoneStep />);

    expect(getByTestId('전화번호 인증')).toBeTruthy();
  });
});

describe('PhoneStep — 인증 완료되지 않으면 다음 버튼 비활성화', () => {
  it('isVerificationComplete=false이면 다음 버튼이 비활성화된다', () => {
    const { getByTestId } = render(<PhoneStep />);

    expect(getByTestId('next-button').props.accessibilityState.disabled).toBe(true);
  });

  it('isVerificationComplete=true이면 다음 버튼이 활성화된다', () => {
    mockUsePasswordResetPhoneVerification.mockReturnValue(
      makePhoneVerificationReturn({ isVerificationComplete: true })
    );

    const { getByTestId } = render(<PhoneStep />);

    expect(getByTestId('next-button').props.accessibilityState.disabled).toBe(false);
  });
});

describe('PhoneStep — 다음/뒤로 동작', () => {
  it('다음 버튼 클릭 시 폼 필드를 업데이트하고 nextStep을 호출한다', () => {
    mockUsePasswordResetPhoneVerification.mockReturnValue(
      makePhoneVerificationReturn({
        phoneNumber: '01012345678',
        verificationCode: '123456',
        isVerificationComplete: true,
      })
    );

    const { getByTestId } = render(<PhoneStep />);

    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdatePhoneNumber).toHaveBeenCalledWith('01012345678');
    expect(mockUpdateVerificationCode).toHaveBeenCalledWith('123456');
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('뒤로 버튼 클릭 시 resetStore를 호출하고 /signin으로 이동한다', () => {
    const { getByTestId } = render(<PhoneStep />);

    fireEvent.press(getByTestId('back-button'));

    expect(mockResetStore).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/signin');
  });
});

describe('PhoneStep — 인증번호 요청/확인', () => {
  it('인증 요청 버튼 클릭 시 requestVerification이 호출된다', () => {
    const { getByTestId } = render(<PhoneStep />);

    fireEvent.press(getByTestId('button-인증'));

    expect(mockRequestVerification).toHaveBeenCalled();
  });

  it('전화번호 에러가 있으면 에러 메시지를 표시한다', () => {
    mockUsePasswordResetPhoneVerification.mockReturnValue(
      makePhoneVerificationReturn({ phoneError: '전화번호는 11자리여야 합니다' })
    );

    const { getAllByTestId } = render(<PhoneStep />);

    expect(getAllByTestId('error-message').length).toBeGreaterThan(0);
  });

  it('인증 진행 중이고 인증 확인 버튼 클릭 시 verifyCode가 호출된다', () => {
    mockUsePasswordResetPhoneVerification.mockReturnValue(
      makePhoneVerificationReturn({
        verificationState: { isVerifying: true, isSendingCode: false, isVerifyingCode: false },
      })
    );

    const { getAllByTestId } = render(<PhoneStep />);

    const verifyButtons = getAllByTestId('button-인증');
    fireEvent.press(verifyButtons[verifyButtons.length - 1]);

    expect(mockVerifyCode).toHaveBeenCalled();
  });

  it('인증 에러가 있으면 에러 메시지를 표시한다', () => {
    mockUsePasswordResetPhoneVerification.mockReturnValue(
      makePhoneVerificationReturn({
        verificationState: { isVerifying: true, isSendingCode: false, isVerifyingCode: false },
        verificationError: '인증번호를 입력해주세요',
      })
    );

    const { getAllByTestId } = render(<PhoneStep />);

    expect(getAllByTestId('error-message').length).toBeGreaterThan(0);
  });
});
