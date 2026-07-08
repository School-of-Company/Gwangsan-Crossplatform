import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { sendSms } from '~/entity/auth/api/sendSms';
import { verifySms } from '~/entity/auth/api/verifySms';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import PhoneStep from '../index';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/entity/auth/api/sendSms', () => ({ sendSms: jest.fn() }));
jest.mock('~/entity/auth/api/verifySms', () => ({ verifySms: jest.fn() }));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSignupFormField: jest.fn(),
  useSignupStepNavigation: jest.fn(),
}));

jest.mock('~/entity/auth/ui/SignupForm', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, onNext, onBack, title, description, nextButtonText }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description),
        children,
        React.createElement(
          TouchableOpacity,
          { testID: 'next-button', onPress: onNext },
          React.createElement(Text, null, nextButtonText || '다음')
        ),
        onBack
          ? React.createElement(
              TouchableOpacity,
              { testID: 'back-button', onPress: onBack },
              React.createElement(Text, null, '뒤로')
            )
          : null
      ),
  };
});

const mockUseSignupFormField = jest.mocked(useSignupFormField);
const mockUseSignupStepNavigation = jest.mocked(useSignupStepNavigation);
const mockSendSms = jest.mocked(sendSms);
const mockVerifySms = jest.mocked(verifySms);

const mockNextStep = jest.fn();
const mockUpdatePhoneNumber = jest.fn();
const mockUpdateVerificationCode = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSignupFormField.mockImplementation((field: string) => {
    if (field === 'phoneNumber') return { value: '', updateField: mockUpdatePhoneNumber };
    return { value: '', updateField: mockUpdateVerificationCode };
  });
  mockUseSignupStepNavigation.mockReturnValue({
    nextStep: mockNextStep,
    prevStep: jest.fn(),
    goToStep: jest.fn(),
    resetStore: jest.fn(),
  });
});

describe('PhoneStep — 렌더링', () => {
  it('타이틀, 설명, 전화번호 입력 필드를 렌더링한다', () => {
    const { getByText, getByPlaceholderText } = render(<PhoneStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('전화번호를 입력해주세요')).toBeTruthy();
    expect(getByPlaceholderText('전화번호를 입력해주세요')).toBeTruthy();
  });

  it('인증번호 입력 필드는 인증 요청 전에는 보이지 않는다', () => {
    const { queryByPlaceholderText } = render(<PhoneStep />);

    expect(queryByPlaceholderText('인증번호를 입력해주세요')).toBeNull();
  });
});

describe('PhoneStep — 인증 요청', () => {
  it('유효한 전화번호로 인증 요청 시 인증번호 입력 필드가 표시된다', async () => {
    mockSendSms.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<PhoneStep />);

    fireEvent.changeText(getByPlaceholderText('전화번호를 입력해주세요'), '01012345678');
    fireEvent.press(getByText('인증'));

    await waitFor(() => {
      expect(mockSendSms).toHaveBeenCalledWith('01012345678');
    });
    await waitFor(() => {
      expect(getByPlaceholderText('인증번호를 입력해주세요')).toBeTruthy();
    });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '인증번호 전송 완료' })
    );
  });

  it('SMS 전송 실패 시 에러 메시지를 표시한다', async () => {
    mockSendSms.mockRejectedValue(new Error('이미 가입된 번호'));

    const { getByPlaceholderText, getByText } = render(<PhoneStep />);

    fireEvent.changeText(getByPlaceholderText('전화번호를 입력해주세요'), '01012345678');
    fireEvent.press(getByText('인증'));

    await waitFor(() => {
      expect(getByText('이미 가입된 번호')).toBeTruthy();
    });
  });
});

describe('PhoneStep — 인증번호 확인 및 다음 단계', () => {
  it('인증 완료 후 다음 클릭 시 값이 저장되고 nextStep이 호출된다', async () => {
    mockSendSms.mockResolvedValue(undefined);
    mockVerifySms.mockResolvedValue({ verified: true });

    const { getByPlaceholderText, getByText, getByTestId } = render(<PhoneStep />);

    fireEvent.changeText(getByPlaceholderText('전화번호를 입력해주세요'), '01012345678');
    fireEvent.press(getByText('인증'));
    await waitFor(() => expect(getByPlaceholderText('인증번호를 입력해주세요')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('인증번호를 입력해주세요'), '123456');
    fireEvent.press(getByText('인증'));

    await waitFor(() => {
      expect(mockVerifySms).toHaveBeenCalledWith('01012345678', '123456');
    });

    await waitFor(() => expect(getByText('인증완료')).toBeTruthy());

    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdatePhoneNumber).toHaveBeenCalledWith('01012345678');
    expect(mockUpdateVerificationCode).toHaveBeenCalledWith('123456');
    expect(mockNextStep).toHaveBeenCalled();
  });
});
