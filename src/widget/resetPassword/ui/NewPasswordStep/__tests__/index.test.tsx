import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { resetPassword } from '~/entity/auth/api/resetPassword';
import {
  useResetPasswordFormField,
  useResetPasswordStepNavigation,
} from '~/entity/auth/model/useAuthSelectors';
import NewPasswordStep from '../index';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('~/entity/auth/api/resetPassword', () => ({
  resetPassword: jest.fn(),
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useResetPasswordFormField: jest.fn(),
  useResetPasswordStepNavigation: jest.fn(),
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
    default: ({ children, onNext, title, description, nextButtonText, isNextDisabled }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description),
        children,
        React.createElement(
          TouchableOpacity,
          { testID: 'next-button', onPress: onNext, disabled: isNextDisabled },
          React.createElement(Text, null, nextButtonText)
        )
      ),
  };
});

const mockResetPassword = resetPassword as jest.Mock;
const mockUseResetPasswordFormField = useResetPasswordFormField as jest.Mock;
const mockUseResetPasswordStepNavigation = useResetPasswordStepNavigation as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

const mockResetStore = jest.fn();
const mockUpdatePhoneNumber = jest.fn();

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();

  mockUseResetPasswordFormField.mockImplementation((field: string) => {
    if (field === 'phoneNumber') {
      return { value: '01012345678', updateField: mockUpdatePhoneNumber };
    }
    return { value: '', updateField: jest.fn() };
  });
  mockUseResetPasswordStepNavigation.mockReturnValue({ resetStore: mockResetStore });

  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

describe('NewPasswordStep — 유효성 검사', () => {
  it('비밀번호를 입력하지 않으면 다음 버튼이 비활성화된다', () => {
    const { getByTestId } = render(<NewPasswordStep />);

    expect(getByTestId('next-button').props.accessibilityState.disabled).toBe(true);
  });

  it('비밀번호와 확인란을 모두 입력하면 다음 버튼이 활성화된다', () => {
    const { getByTestId } = render(<NewPasswordStep />);

    fireEvent.changeText(getByTestId('새 비밀번호'), 'password1!');
    fireEvent.changeText(getByTestId('비밀번호 재입력'), 'password1!');

    expect(getByTestId('next-button').props.accessibilityState.disabled).toBe(false);
  });

  it('비밀번호가 너무 짧으면 에러 메시지를 표시한다', async () => {
    const { getByTestId, getAllByTestId } = render(<NewPasswordStep />);

    fireEvent.changeText(getByTestId('새 비밀번호'), 'abc');
    fireEvent.changeText(getByTestId('비밀번호 재입력'), 'abc');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getAllByTestId('error-message').length).toBeGreaterThan(0);
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('비밀번호와 확인란이 다르면 에러 메시지를 표시한다', async () => {
    const { getByTestId, getAllByTestId } = render(<NewPasswordStep />);

    fireEvent.changeText(getByTestId('새 비밀번호'), 'password1!');
    fireEvent.changeText(getByTestId('비밀번호 재입력'), 'password2!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getAllByTestId('error-message').length).toBeGreaterThan(0);
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});

describe('NewPasswordStep — 비밀번호 재설정 제출', () => {
  it('성공 시 resetPassword를 호출하고 성공 Alert를 표시한다', async () => {
    mockResetPassword.mockResolvedValue({});

    const { getByTestId } = render(<NewPasswordStep />);

    fireEvent.changeText(getByTestId('새 비밀번호'), 'password1!');
    fireEvent.changeText(getByTestId('비밀번호 재입력'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        phoneNumber: '01012345678',
        newPassword: 'password1!',
      });
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        '비밀번호 재설정 완료',
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  it('성공 Alert 확인 클릭 시 resetStore와 router.replace가 호출된다', async () => {
    mockResetPassword.mockResolvedValue({});

    const { getByTestId } = render(<NewPasswordStep />);

    fireEvent.changeText(getByTestId('새 비밀번호'), 'password1!');
    fireEvent.changeText(getByTestId('비밀번호 재입력'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());

    const alertButtons = alertSpy.mock.calls[0][2];
    alertButtons[0].onPress();

    expect(mockResetStore).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/signin');
  });

  it('실패 시 실패 Alert를 표시한다', async () => {
    mockResetPassword.mockRejectedValue(new Error('서버 오류'));

    const { getByTestId } = render(<NewPasswordStep />);

    fireEvent.changeText(getByTestId('새 비밀번호'), 'password1!');
    fireEvent.changeText(getByTestId('비밀번호 재입력'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('비밀번호 재설정 실패', '서버 오류');
    });
    expect(mockResetStore).not.toHaveBeenCalled();
  });

  it('제출 중에는 버튼 텍스트가 "설정 중..."으로 바뀐다', async () => {
    let resolvePromise!: (value?: unknown) => void;
    mockResetPassword.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { getByTestId, getByText } = render(<NewPasswordStep />);

    fireEvent.changeText(getByTestId('새 비밀번호'), 'password1!');
    fireEvent.changeText(getByTestId('비밀번호 재입력'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(getByText('설정 중...')).toBeTruthy());

    resolvePromise();

    await waitFor(() => expect(getByText('비밀번호 재설정')).toBeTruthy());
  });
});
