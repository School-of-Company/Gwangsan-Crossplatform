import React from 'react';
import { Text, Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { useResetPasswordStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import ResetPasswordForm from '../index';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));
jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useResetPasswordStepNavigation: jest.fn(),
}));
jest.mock('@/shared/assets/svg/BackArrow', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

const mockPrevStep = jest.fn();
const mockUseResetPasswordStepNavigation = useResetPasswordStepNavigation as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseResetPasswordStepNavigation.mockReturnValue({ prevStep: mockPrevStep });
});

describe('ResetPasswordForm', () => {
  it('title과 description을 렌더링한다', () => {
    const { getByText } = render(
      <ResetPasswordForm
        title="비밀번호 재설정"
        description="전화번호를 입력해주세요"
        onNext={jest.fn()}>
        <Text>자식 컴포넌트</Text>
      </ResetPasswordForm>
    );

    expect(getByText('비밀번호 재설정')).toBeTruthy();
    expect(getByText('전화번호를 입력해주세요')).toBeTruthy();
    expect(getByText('자식 컴포넌트')).toBeTruthy();
  });

  it('nextButtonText 기본값은 "다음"이다', () => {
    const { getByText } = render(
      <ResetPasswordForm title="T" description="D" onNext={jest.fn()}>
        <Text>child</Text>
      </ResetPasswordForm>
    );

    expect(getByText('다음')).toBeTruthy();
  });

  it('nextButtonText prop을 렌더링한다', () => {
    const { getByText } = render(
      <ResetPasswordForm title="T" description="D" onNext={jest.fn()} nextButtonText="확인">
        <Text>child</Text>
      </ResetPasswordForm>
    );

    expect(getByText('확인')).toBeTruthy();
  });

  it('onNext 버튼 클릭 시 onNext 콜백이 호출된다', () => {
    const mockOnNext = jest.fn();
    const { getByText } = render(
      <ResetPasswordForm title="T" description="D" onNext={mockOnNext} nextButtonText="다음">
        <Text>child</Text>
      </ResetPasswordForm>
    );

    fireEvent.press(getByText('다음'));
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('onBack prop이 있으면 뒤로 버튼 클릭 시 onBack이 호출된다', () => {
    const mockOnBack = jest.fn();
    const { getByText } = render(
      <ResetPasswordForm title="T" description="D" onNext={jest.fn()} onBack={mockOnBack}>
        <Text>child</Text>
      </ResetPasswordForm>
    );

    fireEvent.press(getByText('뒤로'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('onBack prop이 없으면 뒤로 버튼 클릭 시 prevStep이 호출된다', () => {
    const { getByText } = render(
      <ResetPasswordForm title="T" description="D" onNext={jest.fn()}>
        <Text>child</Text>
      </ResetPasswordForm>
    );

    fireEvent.press(getByText('뒤로'));
    expect(mockPrevStep).toHaveBeenCalled();
  });

  it('Android 플랫폼에서도 정상 렌더링된다', () => {
    const original = Platform.OS;
    (Platform as any).OS = 'android';

    const { getByText } = render(
      <ResetPasswordForm title="Android" description="테스트" onNext={jest.fn()}>
        <Text>child</Text>
      </ResetPasswordForm>
    );

    expect(getByText('Android')).toBeTruthy();
    (Platform as any).OS = original;
  });
});
