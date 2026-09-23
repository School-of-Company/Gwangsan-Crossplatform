import React from 'react';
import { Text, Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import SigninForm from '../index';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/shared/assets/svg/BackArrow', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SigninForm', () => {
  it('title과 description을 렌더링한다', () => {
    const { getByText } = render(
      <SigninForm title="로그인" description="닉네임을 입력해주세요" onNext={jest.fn()}>
        <Text>자식 컴포넌트</Text>
      </SigninForm>
    );

    expect(getByText('로그인')).toBeTruthy();
    expect(getByText('닉네임을 입력해주세요')).toBeTruthy();
    expect(getByText('자식 컴포넌트')).toBeTruthy();
  });

  it('nextButtonText 기본값은 "다음"이다', () => {
    const { getByText } = render(
      <SigninForm title="T" description="D" onNext={jest.fn()}>
        <Text>child</Text>
      </SigninForm>
    );

    expect(getByText('다음')).toBeTruthy();
  });

  it('nextButtonText prop을 렌더링한다', () => {
    const { getByText } = render(
      <SigninForm title="T" description="D" onNext={jest.fn()} nextButtonText="완료">
        <Text>child</Text>
      </SigninForm>
    );

    expect(getByText('완료')).toBeTruthy();
  });

  it('onNext 버튼 클릭 시 onNext 콜백이 호출된다', () => {
    const mockOnNext = jest.fn();
    const { getByTestId } = render(
      <SigninForm title="T" description="D" onNext={mockOnNext}>
        <Text>child</Text>
      </SigninForm>
    );

    fireEvent.press(getByTestId('SigninForm-next-button'));
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('onBack prop이 있으면 뒤로 버튼 클릭 시 onBack이 호출된다', () => {
    const mockOnBack = jest.fn();
    const { getByText } = render(
      <SigninForm title="T" description="D" onNext={jest.fn()} onBack={mockOnBack}>
        <Text>child</Text>
      </SigninForm>
    );

    fireEvent.press(getByText('뒤로'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('onBack prop이 없으면 뒤로 버튼 클릭 시 router.back이 호출된다', () => {
    const { getByText } = render(
      <SigninForm title="T" description="D" onNext={jest.fn()}>
        <Text>child</Text>
      </SigninForm>
    );

    fireEvent.press(getByText('뒤로'));
    expect(router.back).toHaveBeenCalled();
  });

  it('Android 플랫폼에서도 정상 렌더링된다', () => {
    const original = Platform.OS;
    (Platform as any).OS = 'android';

    const { getByText } = render(
      <SigninForm title="Android" description="테스트" onNext={jest.fn()}>
        <Text>child</Text>
      </SigninForm>
    );

    expect(getByText('Android')).toBeTruthy();
    (Platform as any).OS = original;
  });

  it('별칭 찾기 클릭 시 /findNickname으로 이동한다', () => {
    const { getByText } = render(
      <SigninForm title="T" description="D" onNext={jest.fn()}>
        <Text>child</Text>
      </SigninForm>
    );

    fireEvent.press(getByText('별칭 찾기'));
    expect(router.push).toHaveBeenCalledWith('/findNickname');
  });

  it('비밀번호 변경하기 클릭 시 /resetPassword로 이동한다', () => {
    const { getByText } = render(
      <SigninForm title="T" description="D" onNext={jest.fn()}>
        <Text>child</Text>
      </SigninForm>
    );

    fireEvent.press(getByText('비밀번호 변경하기'));
    expect(router.push).toHaveBeenCalledWith('/resetPassword');
  });

  it('두 링크 모두 hitSlop을 가진 터치 가능한 link 역할 요소로 렌더링된다', () => {
    const { getByTestId } = render(
      <SigninForm title="T" description="D" onNext={jest.fn()}>
        <Text>child</Text>
      </SigninForm>
    );

    const links = [
      ['SigninForm-find-nickname-link', '/findNickname'],
      ['SigninForm-reset-password-link', '/resetPassword'],
    ] as const;

    links.forEach(([testID, path]) => {
      const link = getByTestId(testID);

      expect(link.props.accessibilityRole ?? link.props.role).toBe('link');
      expect(link.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
      fireEvent.press(link);
      expect(router.push).toHaveBeenCalledWith(path);
    });
  });
});
