import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { passwordSchema } from '~/entity/auth/model/authSchema';
import * as authSchemaModule from '~/entity/auth/model/authSchema';
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

  it('비밀번호 입력 변경 시 비밀번호 에러가 초기화된다', async () => {
    const { getByTestId, getByText, queryByText, getByPlaceholderText } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'abc1');
    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'abc1');
    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => expect(getByText('비밀번호는 8자 이상이어야 합니다')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'password1');

    expect(queryByText('비밀번호는 8자 이상이어야 합니다')).toBeNull();
  });

  // 주의: validateAndNext의 catch 블록은 ZodError만 처리하고 그 외 예외는 무시한다.
  // 이 경우 hasError가 true로 설정되지 않아 검증 실패에도 다음 단계로 진행된다.
  // (다른 Step 컴포넌트와 달리 else/else-if 폴백이 없음 — 잠재적 이슈로 보고함)
  it('비밀번호 스키마가 ZodError가 아닌 예외를 던지면 에러로 처리되지 않고 다음 단계로 이동한다', () => {
    const parseSpy = jest.spyOn(passwordSchema, 'parse').mockImplementationOnce(() => {
      throw new Error('unexpected non-zod error');
    });

    const { getByTestId, getByPlaceholderText } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'password1');
    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'password1');
    fireEvent.press(getByTestId('next-button'));

    expect(mockNextStep).toHaveBeenCalled();

    parseSpy.mockRestore();
  });

  it('비밀번호 확인 스키마가 ZodError가 아닌 예외를 던지면 에러로 처리되지 않고 다음 단계로 이동한다', () => {
    const factorySpy = jest.spyOn(authSchemaModule, 'passwordConfirmSchema').mockReturnValue({
      parse: () => {
        throw new Error('unexpected non-zod error');
      },
    } as unknown as ReturnType<typeof authSchemaModule.passwordConfirmSchema>);

    const { getByTestId, getByPlaceholderText } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'password1');
    fireEvent.changeText(getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'password1');
    fireEvent.press(getByTestId('next-button'));

    expect(mockNextStep).toHaveBeenCalled();

    factorySpy.mockRestore();
  });
});

describe('PasswordStep — 키보드 제출', () => {
  it('비밀번호 입력란에서 제출 시 다음 필드로 포커스를 이동시키며 다음 단계로 넘어가지 않는다', () => {
    const { getByPlaceholderText } = render(<PasswordStep />);

    const passwordInput = getByPlaceholderText('비밀번호를 입력해주세요');

    expect(() => fireEvent(passwordInput, 'onSubmitEditing')).not.toThrow();
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('비밀번호 확인란에서 제출 시 두 값이 모두 채워져 있으면 다음 단계로 이동한다', () => {
    const { getByPlaceholderText } = render(<PasswordStep />);

    fireEvent.changeText(getByPlaceholderText('비밀번호를 입력해주세요'), 'password1');
    const confirmInput = getByPlaceholderText('비밀번호를 다시 입력해주세요');
    fireEvent.changeText(confirmInput, 'password1');
    fireEvent(confirmInput, 'onSubmitEditing');

    expect(mockUpdatePassword).toHaveBeenCalledWith('password1');
    expect(mockUpdatePasswordConfirm).toHaveBeenCalledWith('password1');
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('비밀번호 확인란에서 제출 시 값이 비어 있으면 다음 단계로 이동하지 않는다', () => {
    const { getByPlaceholderText } = render(<PasswordStep />);

    const confirmInput = getByPlaceholderText('비밀번호를 다시 입력해주세요');
    fireEvent(confirmInput, 'onSubmitEditing');

    expect(mockNextStep).not.toHaveBeenCalled();
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
