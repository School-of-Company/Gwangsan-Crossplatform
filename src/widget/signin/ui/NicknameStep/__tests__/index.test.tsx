import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { getCredentialsForBiometric } from '~/entity/auth/api/signin';
import { setData } from '~/shared/lib/setData';
import { useSigninFormField, useSigninStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import NicknameStep from '../index';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('~/entity/auth/api/signin', () => ({
  getCredentialsForBiometric: jest.fn(),
}));

jest.mock('~/shared/lib/setData', () => ({
  setData: jest.fn(),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSigninFormField: jest.fn(),
  useSigninStepNavigation: jest.fn(),
}));

jest.mock('@/shared/ui/Input', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: ({ testID, value, onChangeText, onSubmitEditing }: any) =>
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
    default: ({ children, onNext, onBack, title, description }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description),
        children,
        React.createElement(
          TouchableOpacity,
          { testID: 'next-button', onPress: onNext },
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

const mockGetCredentials = jest.mocked(getCredentialsForBiometric);
const mockSetData = jest.mocked(setData);
const mockUseSigninFormField = jest.mocked(useSigninFormField);
const mockUseSigninStepNavigation = jest.mocked(useSigninStepNavigation);
const mockRouterReplace = jest.mocked(router.replace);

const mockNextStep = jest.fn();
const mockResetStore = jest.fn();
const mockUpdateField = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockUseSigninFormField.mockReturnValue({ value: '', updateField: mockUpdateField });
  mockUseSigninStepNavigation.mockReturnValue({
    nextStep: mockNextStep,
    resetStore: mockResetStore,
    prevStep: jest.fn(),
    goToStep: jest.fn(),
  });
  mockGetCredentials.mockResolvedValue(null);
  mockSetData.mockResolvedValue();
});

describe('NicknameStep — 생체인증 자동 로그인', () => {
  it('저장된 토큰이 없으면 자동 로그인을 시도하지 않는다', async () => {
    mockGetCredentials.mockResolvedValue(null);

    render(<NicknameStep />);

    await waitFor(() => {
      expect(mockSetData).not.toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it('저장된 토큰이 있으면 SecureStore에 저장하고 /main으로 이동한다', async () => {
    mockGetCredentials.mockResolvedValue({ accessToken: 'acc-token', refreshToken: 'ref-token' });

    render(<NicknameStep />);

    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith('accessToken', 'acc-token');
      expect(mockSetData).toHaveBeenCalledWith('refreshToken', 'ref-token');
      expect(mockResetStore).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/main');
    });
  });

  it('토큰 저장 실패 시 /main으로 이동하지 않는다', async () => {
    mockGetCredentials.mockResolvedValue({ accessToken: 'acc-token', refreshToken: 'ref-token' });
    mockSetData.mockRejectedValue(new Error('storage failed'));

    render(<NicknameStep />);

    await waitFor(() => {
      expect(mockRouterReplace).not.toHaveBeenCalledWith('/main');
    });
  });

  it('컴포넌트 언마운트 후에는 resetStore와 router.replace를 호출하지 않는다', async () => {
    let resolveCredentials!: (v: any) => void;
    mockGetCredentials.mockReturnValue(
      new Promise((res) => {
        resolveCredentials = res;
      })
    );

    const { unmount } = render(<NicknameStep />);

    unmount();

    await act(async () => {
      resolveCredentials({ accessToken: 'acc', refreshToken: 'ref' });
    });

    expect(mockSetData).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('setData 완료 후 언마운트 상태면 resetStore와 router를 호출하지 않는다', async () => {
    let resolveSetData!: () => void;
    mockGetCredentials.mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' });
    mockSetData.mockReturnValue(
      new Promise((res) => {
        resolveSetData = res;
      })
    );

    const { unmount } = render(<NicknameStep />);

    await waitFor(() => expect(mockSetData).toHaveBeenCalled());

    unmount();

    await act(async () => {
      resolveSetData();
    });

    expect(mockResetStore).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/main');
  });
});

describe('NicknameStep — 닉네임 입력 및 유효성 검사', () => {
  it('유효한 닉네임 입력 시 다음 단계로 이동한다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith('홍길동');
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('빈 닉네임으로 다음 버튼 클릭 시 에러 메시지를 표시한다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('특수문자 포함 닉네임은 에러 메시지를 표시한다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), 'user@!#');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('닉네임 변경 시 기존 에러가 초기화된다', async () => {
    const { getByTestId, queryByTestId } = render(<NicknameStep />);

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => expect(getByTestId('error-message')).toBeTruthy());

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), '홍길동');
    expect(queryByTestId('error-message')).toBeNull();
  });
});

describe('NicknameStep — 뒤로 버튼', () => {
  it('뒤로 버튼 클릭 시 resetStore를 호출하고 /onboarding으로 이동한다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.press(getByTestId('back-button'));

    expect(mockResetStore).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/onboarding');
  });
});
