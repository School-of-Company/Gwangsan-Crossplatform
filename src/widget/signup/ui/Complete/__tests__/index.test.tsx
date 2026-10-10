import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSignupStore } from '@/shared/store/useSignupStore';
import Complete from '../index';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), replace: jest.fn() },
}));

const mockRouterNavigate = jest.mocked(router.navigate);

const sampleFormData = {
  name: '홍길동',
  nickname: 'gildong',
  password: 'pass1234',
  passwordConfirm: 'pass1234',
  phoneNumber: '01012345678',
  verificationCode: '123456',
  dongName: '평동',
  placeId: 1,
  specialties: ['운동'],
  description: '자기소개',
  recommender: '',
};

beforeEach(() => {
  jest.clearAllMocks();
  useSignupStore.setState({ formData: { ...sampleFormData } });
});

afterEach(() => {
  useSignupStore.getState().resetStore();
});

describe('Complete — 렌더링', () => {
  it('signup을 호출하지 않고 완료 화면을 바로 보여준다', () => {
    const { getByText } = render(<Complete />);

    expect(getByText(/회원가입이/)).toBeTruthy();
    expect(getByText('로그인 페이지로 돌아가기')).toBeTruthy();
  });
});

describe('Complete — 다음 이동', () => {
  it('"로그인 페이지로 돌아가기" 클릭 시 /signin으로 이동하고 스토어를 초기화한다', () => {
    const { getByText } = render(<Complete />);

    fireEvent.press(getByText('로그인 페이지로 돌아가기'));

    expect(mockRouterNavigate).toHaveBeenCalledWith('/signin/nickname');
    expect(useSignupStore.getState().formData.name).toBe('');
  });
});
