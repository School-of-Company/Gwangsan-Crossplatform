import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import PasswordStep from '../index';

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

const mockNextStep = jest.fn();
const mockUpdatePassword = jest.fn();
const mockUpdatePasswordConfirm = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSignupFormField.mockImplementation((field: string) => {
    if (field === 'password') return { value: '', updateField: mockUpdatePassword };
    return { value: '', updateField: mockUpdatePasswordConfirm };
  });
  mockUseSignupStepNavigation.mockReturnValue({
    nextStep: mockNextStep,
    prevStep: jest.fn(),
    goToStep: jest.fn(),
    resetStore: jest.fn(),
  });
});

describe('PasswordStep — 렌더링', () => {
  it('타이틀, 설명, 비밀번호 입력 필드 두 개를 렌더링한다', () => {
    const { getByText, getByPlaceholderText } = render(<PasswordStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('비밀번호를 입력해주세요')).toBeTruthy();
    expect(getByPlaceholderText('비밀번호를 입력해주세요')).toBeTruthy();
    expect(getByPlaceholderText('비밀번호를 다시 입력해주세요')).toBeTruthy();
  });
});

describe('PasswordStep — 유효성 검사', () => {
  it('8자 미만 비밀번호는 에러 메시지를 표시한다', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'abc1');
    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'abc1');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('비밀번호는 8자 이상이어야 합니다')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('비밀번호와 확인이 일치하지 않으면 에러 메시지를 표시한다', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'password1');
    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'password2');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('비밀번호가 일치하지 않습니다')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('입력 변경 시 각각의 에러가 초기화된다', async () => {
    const { getByTestId, getByText, queryByText, getByPlaceholderText } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'password1');
    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'password2');
    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => expect(getByText('비밀번호가 일치하지 않습니다')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'password1');

    expect(queryByText('비밀번호가 일치하지 않습니다')).toBeNull();
  });
});

describe('PasswordStep — 다음 단계로 이동', () => {
  it('유효하고 일치하는 비밀번호 입력 시 두 필드를 업데이트하고 nextStep을 호출한다', () => {
    const { getByPlaceholderText, getByTestId } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'password1');
    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'password1');
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdatePassword).toHaveBeenCalledWith('password1');
    expect(mockUpdatePasswordConfirm).toHaveBeenCalledWith('password1');
    expect(mockNextStep).toHaveBeenCalled();
  });
});
