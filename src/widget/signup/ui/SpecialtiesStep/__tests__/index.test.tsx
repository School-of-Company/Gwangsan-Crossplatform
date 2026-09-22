import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSignupFormField } from '~/entity/auth/model/useAuthSelectors';
import SpecialtiesStep from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSignupFormField: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('@/shared/assets/svg/CheckIcon', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

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

const mockUpdateField = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSignupFormField.mockReturnValue({ value: [], updateField: mockUpdateField });
});

describe('SpecialtiesStep — 렌더링', () => {
  it('타이틀, 설명, 드롭다운 placeholder를 렌더링한다', () => {
    const { getByText } = render(<SpecialtiesStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getByText('자신의 특기를 선택해주세요')).toBeTruthy();
    expect(getByText('특기를 선택해주세요')).toBeTruthy();
  });

  it('초기 선택된 특기가 있으면 표시한다', () => {
    mockUseSignupFormField.mockReturnValue({ value: ['운동'], updateField: mockUpdateField });

    const { getByText } = render(<SpecialtiesStep />);

    expect(getByText('운동')).toBeTruthy();
  });
});

describe('SpecialtiesStep — 특기 선택', () => {
  it('별도 클릭 없이 특기 목록(칩)이 바로 표시되고 여러 개 선택할 수 있다', () => {
    const { getByText, getByTestId } = render(<SpecialtiesStep />);

    fireEvent.press(getByText('빨래하기'));
    fireEvent.press(getByText('청소하기'));
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith(['빨래하기', '청소하기']);
  });
});

describe('SpecialtiesStep — 유효성 검사', () => {
  it('특기를 선택하지 않고 다음 클릭 시 에러 메시지를 표시한다', async () => {
    // 드롭다운 placeholder와 에러 메시지 문구가 동일하므로 발생 횟수로 검증한다.
    const { getByTestId, getAllByText } = render(<SpecialtiesStep />);

    expect(getAllByText('특기를 선택해주세요')).toHaveLength(1);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getAllByText('특기를 선택해주세요')).toHaveLength(2);
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('특기를 선택하면 기존 에러가 초기화된다', async () => {
    const { getByTestId, getAllByText, queryAllByText, getByText } = render(<SpecialtiesStep />);

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => expect(getAllByText('특기를 선택해주세요')).toHaveLength(2));

    fireEvent.press(getByText('빨래하기'));

    // 선택 후에는 placeholder 안내 문구와 에러 문구가 모두 사라지므로 0개가 된다.
    expect(queryAllByText('특기를 선택해주세요')).toHaveLength(0);
  });
});

describe('SpecialtiesStep — 다음 단계로 이동', () => {
  it('특기를 선택한 뒤 다음 클릭 시 updateField와 nextStep이 호출된다', () => {
    const { getByText, getByTestId } = render(<SpecialtiesStep />);

    fireEvent.press(getByText('빨래하기'));
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith(['빨래하기']);
    expect(mockRouterPush).toHaveBeenCalledWith('/signup/description');
  });
});
