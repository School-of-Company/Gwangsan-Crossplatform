import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { renderWithProviders } from '~/test-utils';
import { useSignupFormField } from '~/entity/auth/model/useAuthSelectors';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { signup } from '~/entity/auth/api/signup';
import RecommenderStep from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSignupFormField: jest.fn(),
}));

jest.mock('~/entity/auth/api/signup', () => ({
  signup: jest.fn(),
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
const mockRouterPush = jest.mocked(router.push);
const mockRouterReplace = jest.mocked(router.replace);
const mockSignup = jest.mocked(signup);
const mockToastShow = jest.mocked(Toast.show);

const mockUpdateField = jest.fn();

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
  mockUseSignupFormField.mockReturnValue({ value: '', updateField: mockUpdateField });
  useSignupStore.setState({ formData: { ...sampleFormData } });
});

afterEach(() => {
  useSignupStore.getState().resetStore();
});

describe('RecommenderStep — 렌더링', () => {
  it('타이틀, 설명, 입력 필드를 렌더링한다', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<RecommenderStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('추천인을 입력해주세요')).toBeTruthy();
    expect(getByPlaceholderText('추천인 별칭을 입력해주세요')).toBeTruthy();
  });
});

describe('RecommenderStep — 유효성 검사', () => {
  it('빈 값으로 다음 클릭 시 에러 메시지를 표시한다', async () => {
    const { getByTestId, getByText } = renderWithProviders(<RecommenderStep />);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('별칭을 입력해주세요')).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('허용되지 않는 특수문자가 포함되면 에러 메시지를 표시한다', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
      <RecommenderStep />
    );

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), 'rec@!');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('한글, 영문, 숫자만 입력 가능합니다')).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('입력 변경 시 기존 에러가 초기화된다', async () => {
    const { getByTestId, getByText, queryByText, getByPlaceholderText } = renderWithProviders(
      <RecommenderStep />
    );

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => expect(getByText('별칭을 입력해주세요')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '홍길동');

    expect(queryByText('별칭을 입력해주세요')).toBeNull();
  });
});

describe('RecommenderStep — 회원가입 성공', () => {
  it('유효한 추천인 입력 시 signup 호출 후 완료 화면으로 이동한다', async () => {
    mockSignup.mockResolvedValue({});

    const { getByPlaceholderText, getByTestId } = renderWithProviders(<RecommenderStep />);

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith('홍길동');
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
    });
    expect(mockSignup.mock.calls[0][0]).toEqual(
      expect.objectContaining({ name: '홍길동', recommender: '홍길동' })
    );
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/signup/complete');
    });
  });

  it('키보드 제출(onSubmitEditing) 시 유효한 값이면 signup을 호출한다', async () => {
    mockSignup.mockResolvedValue({});

    const { getByPlaceholderText } = renderWithProviders(<RecommenderStep />);

    const input = getByPlaceholderText('추천인 별칭을 입력해주세요');
    fireEvent.changeText(input, '홍길동');
    fireEvent(input, 'onSubmitEditing');

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
    });
  });

  it('키보드 제출(onSubmitEditing) 시 빈 값이면 signup을 호출하지 않는다', () => {
    const { getByPlaceholderText } = renderWithProviders(<RecommenderStep />);

    const input = getByPlaceholderText('추천인 별칭을 입력해주세요');
    fireEvent(input, 'onSubmitEditing');

    expect(mockSignup).not.toHaveBeenCalled();
  });
});

describe('RecommenderStep — 회원가입 실패', () => {
  it('추천인이 존재하지 않으면 에러를 토스트로 표시하고 화면을 이동하지 않는다', async () => {
    mockSignup.mockRejectedValue(new Error('존재하지 않는 추천인입니다'));

    const { getByPlaceholderText, getByTestId } = renderWithProviders(<RecommenderStep />);

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '없는사람');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '회원가입 실패',
          text2: '존재하지 않는 추천인입니다',
        })
      );
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
    // 입력값이 그대로 유지된다
    expect(getByPlaceholderText('추천인 별칭을 입력해주세요').props.value).toBe('없는사람');
  });

  it('백엔드가 강제 탈퇴 메시지를 반환해도 존재하지 않는 회원 메시지로 표시한다', async () => {
    mockSignup.mockRejectedValue(new Error('강제 탈퇴 처리된 회원입니다.'));

    const { getByPlaceholderText, getByTestId } = renderWithProviders(<RecommenderStep />);

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '없는사람');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '회원가입 실패',
          text2: '존재하지 않는 회원입니다.',
        })
      );
    });
  });
});

describe('RecommenderStep — 예외 처리', () => {
  it('updateField에서 일반 Error가 발생하면 해당 메시지를 표시한다', async () => {
    mockUpdateField.mockImplementation(() => {
      throw new Error('일반 에러 메시지');
    });
    const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
      <RecommenderStep />
    );

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('일반 에러 메시지')).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('updateField에서 Error가 아닌 값이 throw되면 기본 에러 메시지를 표시한다', async () => {
    mockUpdateField.mockImplementation(() => {
      throw 'string error';
    });
    const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
      <RecommenderStep />
    );

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getByText('유효하지 않은 별칭입니다')).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });
});

describe('RecommenderStep — SMS 인증 만료(#784)', () => {
  const smsAuthExpiredError = () => {
    const { AxiosError, AxiosHeaders } = jest.requireActual('axios');
    // signup API는 toAppError로 서버 메시지를 담은 AxiosError를 던진다
    return new AxiosError('SMS 인증 정보를 찾을 수 없습니다.', '404', undefined, undefined, {
      status: 404,
      statusText: '',
      data: { message: 'SMS 인증 정보를 찾을 수 없습니다.' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
  };

  it('재인증 안내와 "전화번호 다시 인증하기" 버튼을 보여준다', async () => {
    mockSignup.mockRejectedValue(smsAuthExpiredError());

    const { getByPlaceholderText, getByTestId, getByText } = renderWithProviders(
      <RecommenderStep />
    );

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(getByText('전화번호 다시 인증하기')).toBeTruthy());
    expect(getByText(/전화번호 인증 시간이 지났습니다/)).toBeTruthy();
  });

  it('"전화번호 다시 인증하기" 클릭 시 재인증 모드로 전화번호 단계로 이동한다', async () => {
    mockSignup.mockRejectedValue(smsAuthExpiredError());

    const { getByPlaceholderText, getByTestId, getByText } = renderWithProviders(
      <RecommenderStep />
    );

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => expect(getByText('전화번호 다시 인증하기')).toBeTruthy());
    fireEvent.press(getByText('전화번호 다시 인증하기'));

    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/signup/phoneNumber',
      params: { reverify: 'true' },
    });
  });

  it('SMS와 무관한 404(추천인 없음 등)는 기존처럼 토스트로 표시한다', async () => {
    const err = smsAuthExpiredError();
    err.message = '추천인이 존재하지 않습니다.';
    mockSignup.mockRejectedValue(err);

    const { getByPlaceholderText, getByTestId } = renderWithProviders(<RecommenderStep />);

    fireEvent.changeText(getByPlaceholderText('추천인 별칭을 입력해주세요'), '홍길동');
    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text2: '추천인이 존재하지 않습니다.' })
      );
    });
  });
});
