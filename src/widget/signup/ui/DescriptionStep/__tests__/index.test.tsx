import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import DescriptionStep from '../index';

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

describe('DescriptionStep — 렌더링', () => {
  it('타이틀, 설명, 입력 필드를 렌더링한다', () => {
    const { getByText, getByPlaceholderText } = render(<DescriptionStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('자신을 소개하는 글을 작성해주세요')).toBeTruthy();
    expect(getByPlaceholderText('자신을 소개하는 글을 작성해주세요.')).toBeTruthy();
  });

  it('초기값이 있으면 입력 필드에 표시한다', () => {
    mockUseSignupFormField.mockReturnValue({
      value: '기존 자기소개',
      updateField: mockUpdateField,
    });

    const { getByDisplayValue } = render(<DescriptionStep />);

    expect(getByDisplayValue('기존 자기소개')).toBeTruthy();
  });
});

describe('DescriptionStep — 유효성 검사', () => {
  it('빈 값으로 다음 클릭 시 에러 메시지를 표시하고 다음 단계로 이동하지 않는다', async () => {
    const { getByTestId, getByText } = render(<DescriptionStep />);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('자기소개는 최소 1자 이상 작성해주세요')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
    expect(mockUpdateField).not.toHaveBeenCalled();
  });

  it('입력 시 기존 에러가 초기화된다', async () => {
    const { getByTestId, getByText, queryByText, getByPlaceholderText } = render(
      <DescriptionStep />
    );

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => {
      expect(getByText('자기소개는 최소 1자 이상 작성해주세요')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('자신을 소개하는 글을 작성해주세요.'),
      '안녕하세요 반갑습니다'
    );

    expect(queryByText('자기소개는 최소 1자 이상 작성해주세요')).toBeNull();
  });
});

describe('DescriptionStep — 다음 단계로 이동', () => {
  it('유효한 자기소개 입력 시 updateField와 nextStep이 호출된다', () => {
    const { getByTestId, getByPlaceholderText } = render(<DescriptionStep />);

    fireEvent.changeText(
      getByPlaceholderText('자신을 소개하는 글을 작성해주세요.'),
      '안녕하세요 반갑습니다'
    );
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith('안녕하세요 반갑습니다');
    expect(mockNextStep).toHaveBeenCalled();
  });
});
