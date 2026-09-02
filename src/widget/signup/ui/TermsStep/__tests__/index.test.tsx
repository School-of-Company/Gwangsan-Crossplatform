import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import TermsStep from '../index';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSignupStepNavigation: jest.fn(),
}));

jest.mock('~/entity/auth/ui/SignupForm', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onNext,
      onBack,
      title,
      description,
      nextButtonText,
      isNextDisabled,
    }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description),
        children,
        React.createElement(
          TouchableOpacity,
          { testID: 'next-button', onPress: onNext, disabled: isNextDisabled },
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

const mockUseSignupStepNavigation = jest.mocked(useSignupStepNavigation);
const mockRouterBack = jest.mocked(router.back);

const mockNextStep = jest.fn();
const mockResetStore = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSignupStepNavigation.mockReturnValue({
    nextStep: mockNextStep,
    prevStep: jest.fn(),
    goToStep: jest.fn(),
    resetStore: mockResetStore,
  });
});

describe('TermsStep — 렌더링', () => {
  it('타이틀, 설명, 전체 동의, 개별 약관 항목을 렌더링한다', () => {
    const { getByText } = render(<TermsStep />);

    expect(getByText('약관 동의')).toBeTruthy();
    expect(getByText('안전한 서비스 이용을 위해 약관에 동의해주세요')).toBeTruthy();
    expect(getByText('약관 전체 동의')).toBeTruthy();
    expect(getByText('이용약관 동의 (필수)')).toBeTruthy();
    expect(getByText('개인정보처리방침 동의 (필수)')).toBeTruthy();
    expect(getByText('동의하고 계속')).toBeTruthy();
  });
});

describe('TermsStep — 개별 동의', () => {
  it('아무것도 체크하지 않으면 다음 버튼이 비활성화 상태다', () => {
    const { getByTestId } = render(<TermsStep />);

    expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('이용약관만 동의하면 다음 버튼이 여전히 비활성화 상태다', () => {
    const { getByTestId, getByText } = render(<TermsStep />);

    fireEvent.press(getByText('이용약관 동의 (필수)'));

    expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('이용약관과 개인정보처리방침 모두 동의하면 다음 버튼이 활성화된다', () => {
    const { getByTestId, getByText } = render(<TermsStep />);

    fireEvent.press(getByText('이용약관 동의 (필수)'));
    fireEvent.press(getByText('개인정보처리방침 동의 (필수)'));

    expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(false);
  });
});

describe('TermsStep — 전체 동의', () => {
  it('전체 동의를 누르면 두 항목이 모두 체크되어 다음 버튼이 활성화된다', () => {
    const { getByTestId, getByText } = render(<TermsStep />);

    fireEvent.press(getByText('약관 전체 동의'));

    expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(false);
  });

  it('전체 동의 상태에서 다시 누르면 두 항목이 모두 해제된다', () => {
    const { getByTestId, getByText } = render(<TermsStep />);

    fireEvent.press(getByText('약관 전체 동의'));
    fireEvent.press(getByText('약관 전체 동의'));

    expect(getByTestId('next-button').props.accessibilityState?.disabled).toBe(true);
  });
});

describe('TermsStep — 약관 내용 확인', () => {
  it('기본적으로 약관 내용 시트는 표시되지 않는다', () => {
    const { queryByTestId } = render(<TermsStep />);

    expect(queryByTestId('sheet-content')).toBeNull();
  });

  it('이용약관의 > 아이콘을 누르면 이용약관 내용이 담긴 시트가 열린다', () => {
    const { getByTestId, getByText } = render(<TermsStep />);

    fireEvent.press(getByTestId('view-terms'));

    expect(getByText('이용약관 동의')).toBeTruthy();
    expect(getByTestId('sheet-content')).toBeTruthy();
  });

  it('개인정보처리방침의 > 아이콘을 누르면 개인정보처리방침 내용이 담긴 시트가 열린다', () => {
    const { getByTestId, getByText } = render(<TermsStep />);

    fireEvent.press(getByTestId('view-privacy'));

    expect(getByText('개인정보처리방침 동의')).toBeTruthy();
    expect(getByTestId('sheet-content')).toBeTruthy();
  });

  it('시트의 닫기 버튼을 누르면 더 이상 표시되지 않는다', () => {
    const { getByTestId, queryByTestId } = render(<TermsStep />);

    fireEvent.press(getByTestId('view-terms'));
    expect(getByTestId('sheet-content')).toBeTruthy();

    fireEvent.press(getByTestId('sheet-close-button'));
    expect(queryByTestId('sheet-content')).toBeNull();
  });
});

describe('TermsStep — 다음 단계로 이동', () => {
  it('모두 동의 후 다음 클릭 시 nextStep이 호출된다', () => {
    const { getByTestId, getByText } = render(<TermsStep />);

    fireEvent.press(getByText('약관 전체 동의'));
    fireEvent.press(getByTestId('next-button'));

    expect(mockNextStep).toHaveBeenCalled();
  });
});

describe('TermsStep — 뒤로가기', () => {
  it('뒤로 버튼 클릭 시 resetStore를 호출하고 이전 화면으로 이동한다', () => {
    const { getByTestId } = render(<TermsStep />);

    fireEvent.press(getByTestId('back-button'));

    expect(mockResetStore).toHaveBeenCalled();
    expect(mockRouterBack).toHaveBeenCalled();
  });
});
