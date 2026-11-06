import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSigninFormField, useSigninResetStore } from '~/entity/auth/model/useAuthSelectors';
import { nicknameSchema } from '~/entity/auth/model/authSchema';
import NicknameStep from '../index';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    dismissTo: jest.fn(),
    canDismiss: jest.fn(() => false),
    dismissAll: jest.fn(),
  },
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSigninFormField: jest.fn(),
  useSigninResetStore: jest.fn(),
}));

jest.mock('~/shared/ui/Input', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: ({ testID, value, onChangeText, onSubmitEditing }: any) =>
      React.createElement(TextInput, { testID, value, onChangeText, onSubmitEditing }),
  };
});

jest.mock('~/shared/ui/ErrorMessage', () => {
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

const mockUseSigninFormField = jest.mocked(useSigninFormField);
const mockUseSigninResetStore = jest.mocked(useSigninResetStore);
const mockRouterPush = jest.mocked(router.push);
const mockRouterReplace = jest.mocked(router.replace);
const mockRouterDismissTo = jest.mocked(router.dismissTo);

const mockResetStore = jest.fn();
const mockUpdateField = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockUseSigninFormField.mockReturnValue({ value: '', updateField: mockUpdateField });
  mockUseSigninResetStore.mockReturnValue(mockResetStore);
});

describe('NicknameStep — 진입', () => {
  it('마운트만으로는 로그인 처리를 하지 않고 별칭 입력을 기다린다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    await waitFor(() => expect(getByTestId('NicknameStep-nickname-input')).toBeTruthy());
    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(mockResetStore).not.toHaveBeenCalled();
  });
});

describe('NicknameStep — 닉네임 입력 및 유효성 검사', () => {
  it('유효한 닉네임 입력 시 다음 단계로 이동한다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith('홍길동');
    expect(mockRouterPush).toHaveBeenCalledWith('/signin/password');
  });

  it('빈 닉네임으로 다음 버튼 클릭 시 에러 메시지를 표시한다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('특수문자 포함 닉네임은 에러 메시지를 표시한다', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), 'user@!#');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('닉네임 변경 시 기존 에러가 초기화된다', async () => {
    const { getByTestId, queryByTestId } = render(<NicknameStep />);

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => expect(getByTestId('error-message')).toBeTruthy());

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), '홍길동');
    expect(queryByTestId('error-message')).toBeNull();
  });

  it('ZodError가 아닌 일반 Error가 발생하면 해당 에러 메시지를 표시한다', async () => {
    const parseSpy = jest.spyOn(nicknameSchema, 'parse').mockImplementation(() => {
      throw new Error('일반 에러 메시지');
    });

    const { getByTestId, getByText } = render(<NicknameStep />);

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(getByText('일반 에러 메시지')).toBeTruthy());
    expect(mockRouterPush).not.toHaveBeenCalled();

    parseSpy.mockRestore();
  });

  it('Error 인스턴스가 아닌 예외가 발생하면 기본 에러 메시지를 표시한다', async () => {
    const parseSpy = jest.spyOn(nicknameSchema, 'parse').mockImplementation(() => {
      throw '문자열 예외';
    });

    const { getByTestId, getByText } = render(<NicknameStep />);

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(getByText('유효하지 않은 별칭입니다')).toBeTruthy());
    expect(mockRouterPush).not.toHaveBeenCalled();

    parseSpy.mockRestore();
  });

  it('닉네임 입력 후 키보드에서 제출하면 다음 단계로 이동한다', () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.changeText(getByTestId('NicknameStep-nickname-input'), '홍길동');
    fireEvent(getByTestId('NicknameStep-nickname-input'), 'submitEditing');

    expect(mockUpdateField).toHaveBeenCalledWith('홍길동');
    expect(mockRouterPush).toHaveBeenCalledWith('/signin/password');
  });

  it('빈 닉네임으로 키보드 제출 시 다음 단계로 이동하지 않는다', () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent(getByTestId('NicknameStep-nickname-input'), 'submitEditing');

    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

describe('NicknameStep — 뒤로 버튼', () => {
  it('뒤로 버튼 클릭 시 resetStore를 호출하고 dismissTo로 /onboarding까지 되돌아간다(뒤로가기 pop 애니메이션 유지)', async () => {
    const { getByTestId } = render(<NicknameStep />);

    fireEvent.press(getByTestId('back-button'));

    expect(mockResetStore).toHaveBeenCalled();
    expect(mockRouterDismissTo).toHaveBeenCalledWith('/onboarding');
  });
});
