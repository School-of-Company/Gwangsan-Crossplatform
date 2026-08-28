import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import NicknameStep from '../index';

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
const mockUpdateField = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSignupFormField.mockReturnValue({ value: '', updateField: mockUpdateField });
  mockUseSignupStepNavigation.mockReturnValue({
    nextStep: mockNextStep,
    prevStep: jest.fn(),
    goToStep: jest.fn(),
    resetStore: jest.fn(),
  });
});

describe('NicknameStep — 렌더링', () => {
  it('타이틀, 설명, 입력 필드를 렌더링한다', () => {
    const { getByText, getByPlaceholderText } = render(<NicknameStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('별칭을 입력해주세요')).toBeTruthy();
    expect(getByPlaceholderText('별칭을 입력해주세요')).toBeTruthy();
  });
});

describe('NicknameStep — 유효성 검사', () => {
  it('빈 값으로 다음 클릭 시 에러 메시지를 표시한다', async () => {
    // description과 에러 메시지 문구가 동일하므로 발생 횟수로 검증한다.
    const { getByTestId, getAllByText } = render(<NicknameStep />);

    expect(getAllByText('별칭을 입력해주세요')).toHaveLength(1);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getAllByText('별칭을 입력해주세요')).toHaveLength(2);
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('허용되지 않는 특수문자가 포함되면 에러 메시지를 표시한다', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<NicknameStep />);

    fireEvent.changeText(getByPlaceholderText('별칭을 입력해주세요'), 'nick@!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('한글, 영문, 숫자만 입력 가능합니다')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('입력 변경 시 기존 에러가 초기화된다', async () => {
    const { getByTestId, getAllByText, getByPlaceholderText } = render(<NicknameStep />);

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => expect(getAllByText('별칭을 입력해주세요')).toHaveLength(2));

    fireEvent.changeText(getByPlaceholderText('별칭을 입력해주세요'), '홍길동');

    expect(getAllByText('별칭을 입력해주세요')).toHaveLength(1);
  });
});

describe('NicknameStep — 다음 단계로 이동', () => {
  it('유효한 별칭 입력 시 updateField와 nextStep이 호출된다', () => {
    const { getByPlaceholderText, getByTestId } = render(<NicknameStep />);

    fireEvent.changeText(getByPlaceholderText('별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith('홍길동');
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('키보드 제출(onSubmitEditing) 시 유효한 값이면 다음 단계로 이동한다', () => {
    const { getByPlaceholderText } = render(<NicknameStep />);

    const input = getByPlaceholderText('별칭을 입력해주세요');
    fireEvent.changeText(input, '홍길동');
    fireEvent(input, 'onSubmitEditing');

    expect(mockUpdateField).toHaveBeenCalledWith('홍길동');
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('키보드 제출(onSubmitEditing) 시 빈 값이면 다음 단계로 이동하지 않는다', () => {
    const { getByPlaceholderText } = render(<NicknameStep />);

    const input = getByPlaceholderText('별칭을 입력해주세요');
    fireEvent(input, 'onSubmitEditing');

    expect(mockNextStep).not.toHaveBeenCalled();
  });
});

describe('NicknameStep — 예외 처리', () => {
  it('updateField에서 일반 Error가 발생하면 해당 메시지를 표시한다', async () => {
    mockUpdateField.mockImplementation(() => {
      throw new Error('일반 에러 메시지');
    });
    const { getByTestId, getByText, getByPlaceholderText } = render(<NicknameStep />);

    fireEvent.changeText(getByPlaceholderText('별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('일반 에러 메시지')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('updateField에서 Error가 아닌 값이 throw되면 기본 에러 메시지를 표시한다', async () => {
    mockUpdateField.mockImplementation(() => {
      throw 'string error';
    });
    const { getByTestId, getByText, getByPlaceholderText } = render(<NicknameStep />);

    fireEvent.changeText(getByPlaceholderText('별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('유효하지 않은 별칭입니다')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });
});
