import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { signup } from '~/entity/auth/api/signup';
import Complete from '../index';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/entity/auth/api/signup', () => ({
  signup: jest.fn(),
}));

const mockSignup = jest.mocked(signup);
const mockRouterNavigate = jest.mocked(router.navigate);
const mockToastShow = jest.mocked(Toast.show);

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

describe('Complete — 마운트 시 회원가입 요청', () => {
  it('로딩 인디케이터를 보여주며 스토어의 formData로 signup을 호출한다', async () => {
    let resolveSignup!: (v: unknown) => void;
    mockSignup.mockReturnValue(
      new Promise((res) => {
        resolveSignup = res;
      })
    );

    const { getByText } = render(<Complete />);

    expect(getByText('회원가입 처리 중...')).toBeTruthy();
    expect(mockSignup).toHaveBeenCalledWith(expect.objectContaining({ name: '홍길동' }));

    resolveSignup({});
    await waitFor(() => expect(mockToastShow).toHaveBeenCalled());
  });
});

describe('Complete — 가입 성공', () => {
  it('성공 메시지와 완료 화면을 보여주고 성공 토스트를 띄운다', async () => {
    mockSignup.mockResolvedValue({});

    const { getByText } = render(<Complete />);

    await waitFor(() => {
      expect(getByText(/회원가입이/)).toBeTruthy();
    });
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '회원가입 완료' })
    );
  });

  it('"로그인 페이지로 돌아가기" 클릭 시 /signin으로 이동하고 스토어를 초기화한다', async () => {
    mockSignup.mockResolvedValue({});

    const { getByText } = render(<Complete />);

    await waitFor(() => expect(getByText('로그인 페이지로 돌아가기')).toBeTruthy());

    fireEvent.press(getByText('로그인 페이지로 돌아가기'));

    expect(mockRouterNavigate).toHaveBeenCalledWith('/signin');
    expect(useSignupStore.getState().formData.name).toBe('');
    expect(useSignupStore.getState().currentStep).toBe('terms');
  });
});

describe('Complete — 가입 실패', () => {
  it('에러 메시지와 다시 시도 버튼을 보여주고 실패 토스트를 띄운다', async () => {
    mockSignup.mockRejectedValue(new Error('이미 가입된 사용자입니다'));

    const { getByText } = render(<Complete />);

    await waitFor(() => {
      expect(getByText('이미 가입된 사용자입니다')).toBeTruthy();
    });
    expect(getByText('다시 시도')).toBeTruthy();
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '회원가입 실패' })
    );
  });

  it('"다시 시도" 클릭 시 스토어를 초기화하고 /onboarding으로 이동한다', async () => {
    mockSignup.mockRejectedValue(new Error('실패'));

    const { getByText } = render(<Complete />);

    await waitFor(() => expect(getByText('다시 시도')).toBeTruthy());

    fireEvent.press(getByText('다시 시도'));

    expect(mockRouterNavigate).toHaveBeenCalledWith('/onboarding');
    expect(useSignupStore.getState().formData.name).toBe('');
  });
});
