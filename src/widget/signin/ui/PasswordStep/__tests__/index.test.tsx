import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { signinWithDeviceInfo, saveCredentialsForBiometric } from '~/entity/auth/api/signin';
import { useSigninFormField, useSigninStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import PasswordStep from '../index';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), canDismiss: jest.fn(() => false), dismissAll: jest.fn() },
}));

jest.mock('~/entity/auth/api/signin', () => ({
  signinWithDeviceInfo: jest.fn(),
  saveCredentialsForBiometric: jest.fn(),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

jest.mock('@sentry/react-native', () => ({
  setUser: jest.fn(),
}));

jest.mock('~/shared/lib/socket', () => ({
  chatSocket: { connect: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSigninFormField: jest.fn(),
  useSigninStepNavigation: jest.fn(),
}));

jest.mock('@/shared/ui/PasswordInput', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    PasswordInput: ({ testID, value, onChangeText, onSubmitEditing }: any) =>
      React.createElement(TextInput, { testID, value, onChangeText, onSubmitEditing }),
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

jest.mock('~/entity/auth/ui/SigninForm', () => {
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

const mockSigninWithDeviceInfo = signinWithDeviceInfo as jest.Mock;
const mockSaveCredentials = saveCredentialsForBiometric as jest.Mock;
const mockUseSigninFormField = useSigninFormField as jest.Mock;
const mockUseSigninStepNavigation = useSigninStepNavigation as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;
const mockCanDismiss = router.canDismiss as jest.Mock;
const mockDismissAll = router.dismissAll as jest.Mock;

const mockUpdateField = jest.fn();
const mockResetStore = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockUseSigninFormField.mockImplementation((field: string) => {
    if (field === 'nickname') return { value: '홍길동', updateField: jest.fn() };
    return { value: '', updateField: mockUpdateField };
  });
  mockUseSigninStepNavigation.mockReturnValue({ resetStore: mockResetStore });
  mockSaveCredentials.mockResolvedValue(undefined);
  mockCanDismiss.mockReturnValue(false);
});

describe('PasswordStep — 유효성 검사', () => {
  it('비밀번호가 비어있으면 다음 버튼이 비활성화된다', () => {
    const { getByTestId } = render(<PasswordStep />);

    expect(getByTestId('next-button').props.accessibilityState.disabled).toBe(true);
  });

  it('비밀번호를 입력하면 다음 버튼이 활성화된다', () => {
    const { getByTestId } = render(<PasswordStep />);

    fireEvent.changeText(getByTestId('PasswordStep-password-input'), 'password1!');

    expect(getByTestId('next-button').props.accessibilityState.disabled).toBe(false);
  });

  it('비밀번호가 너무 짧으면 에러 메시지를 표시하고 로그인을 시도하지 않는다', async () => {
    const { getByTestId } = render(<PasswordStep />);

    fireEvent.changeText(getByTestId('PasswordStep-password-input'), 'abc');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockSigninWithDeviceInfo).not.toHaveBeenCalled();
  });
});

describe('PasswordStep — 로그인 성공', () => {
  it('로그인 성공 시 자격 증명을 저장하고 /main으로 이동한다', async () => {
    mockSigninWithDeviceInfo.mockResolvedValue({
      accessToken: 'acc-token',
      refreshToken: 'ref-token',
    });

    const { getByTestId } = render(<PasswordStep />);

    fireEvent.changeText(getByTestId('PasswordStep-password-input'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(mockSigninWithDeviceInfo).toHaveBeenCalledWith({
        nickname: '홍길동',
        password: 'password1!',
      });
    });

    await waitFor(() => {
      expect(mockResetStore).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/main');
    });

    expect(Sentry.setUser).toHaveBeenCalledWith({ username: '홍길동' });
  });

  it('dismiss 가능한 화면 스택이 있으면 dismissAll을 호출한다', async () => {
    mockSigninWithDeviceInfo.mockResolvedValue({
      accessToken: 'acc-token',
      refreshToken: 'ref-token',
    });
    mockCanDismiss.mockReturnValue(true);

    const { getByTestId } = render(<PasswordStep />);

    fireEvent.changeText(getByTestId('PasswordStep-password-input'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(mockDismissAll).toHaveBeenCalled());
  });

  it('로딩 중에는 버튼 텍스트가 "로그인 중..."으로 바뀐다', async () => {
    let resolvePromise!: (v: any) => void;
    mockSigninWithDeviceInfo.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { getByTestId, getByText } = render(<PasswordStep />);

    fireEvent.changeText(getByTestId('PasswordStep-password-input'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(getByText('로그인 중...')).toBeTruthy());

    resolvePromise({ accessToken: 'a', refreshToken: 'b' });

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/main'));
  });
});

describe('PasswordStep — 로그인 실패', () => {
  it('로그인 실패 시 에러 메시지를 표시한다', async () => {
    mockSigninWithDeviceInfo.mockRejectedValue(new Error('로그인 실패'));

    const { getByTestId } = render(<PasswordStep />);

    fireEvent.changeText(getByTestId('PasswordStep-password-input'), 'password1!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/main');
  });

  it('공백만 있는 비밀번호로 제출해도 로그인을 시도하지 않는다', () => {
    const { getByTestId } = render(<PasswordStep />);

    fireEvent.changeText(getByTestId('PasswordStep-password-input'), '   ');
    fireEvent.press(getByTestId('next-button'));

    expect(mockSigninWithDeviceInfo).not.toHaveBeenCalled();
  });
});
