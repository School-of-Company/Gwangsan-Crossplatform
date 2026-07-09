import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import DongStep from '../index';

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

describe('DongStep — 렌더링', () => {
  it('타이틀, 설명, 검색 입력 필드를 렌더링한다', () => {
    const { getByText, getByPlaceholderText } = render(<DongStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('동네를 선택해주세요')).toBeTruthy();
    expect(getByPlaceholderText('동네를 검색해주세요')).toBeTruthy();
  });
});

describe('DongStep — 검색 및 선택', () => {
  it('검색어를 입력하면 일치하는 동네 목록이 표시된다', () => {
    const { getByPlaceholderText, getByText } = render(<DongStep />);

    fireEvent.changeText(getByPlaceholderText('동네를 검색해주세요'), '평');

    expect(getByText('평동')).toBeTruthy();
  });

  it('동네를 선택하면 검색 결과가 닫히고 선택값이 입력창에 표시된다', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<DongStep />);

    fireEvent.changeText(getByPlaceholderText('동네를 검색해주세요'), '평');
    fireEvent.press(getByText('평동'));

    expect(getByPlaceholderText('동네를 검색해주세요').props.value).toBe('평동');
    expect(queryByText('첨단1동')).toBeNull();
  });
});

describe('DongStep — 유효성 검사', () => {
  it('동네를 선택하지 않고 다음 클릭 시 에러 메시지를 표시한다', async () => {
    const { getByTestId, getByText } = render(<DongStep />);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('동네를 입력해주세요')).toBeTruthy();
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('검색어 변경 시 기존 에러가 초기화된다', async () => {
    const { getByTestId, getByText, queryByText, getByPlaceholderText } = render(<DongStep />);

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => {
      expect(getByText('동네를 입력해주세요')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('동네를 검색해주세요'), '평');

    expect(queryByText('동네를 입력해주세요')).toBeNull();
  });
});

describe('DongStep — 다음 단계로 이동', () => {
  it('동네를 선택한 뒤 다음 클릭 시 updateField와 nextStep이 호출된다', () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<DongStep />);

    fireEvent.changeText(getByPlaceholderText('동네를 검색해주세요'), '평');
    fireEvent.press(getByText('평동'));
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith('평동');
    expect(mockNextStep).toHaveBeenCalled();
  });
});
