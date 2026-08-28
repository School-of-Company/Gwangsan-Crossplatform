import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import PlaceStep from '../index';

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
  mockUseSignupFormField.mockReturnValue({ value: 0, updateField: mockUpdateField });
  mockUseSignupStepNavigation.mockReturnValue({
    nextStep: mockNextStep,
    prevStep: jest.fn(),
    goToStep: jest.fn(),
    resetStore: jest.fn(),
  });
});

describe('PlaceStep — 렌더링', () => {
  it('타이틀, 설명, 드롭다운 placeholder를 렌더링한다', () => {
    // description과 드롭다운 placeholder 문구가 동일하므로 발생 횟수로 검증한다.
    const { getByText, getAllByText } = render(<PlaceStep />);

    expect(getByText('회원가입')).toBeTruthy();
    expect(getAllByText('지점을 선택해주세요')).toHaveLength(2);
  });

  it('초기 placeId가 있으면 해당 지점명을 표시한다', () => {
    mockUseSignupFormField.mockReturnValue({ value: 5, updateField: mockUpdateField });

    const { getByText } = render(<PlaceStep />);

    expect(getByText('도산')).toBeTruthy();
  });
});

describe('PlaceStep — 지점 선택', () => {
  it('드롭다운 클릭 시 지점 목록이 표시되고 선택할 수 있다', () => {
    const { getAllByText, getByText, queryByText } = render(<PlaceStep />);

    fireEvent.press(getAllByText('지점을 선택해주세요')[1]);
    expect(getByText('평동')).toBeTruthy();

    fireEvent.press(getByText('평동'));

    expect(getByText('평동')).toBeTruthy();
    expect(queryByText('수완마을')).toBeNull();
  });
});

describe('PlaceStep — 유효성 검사', () => {
  it('지점을 선택하지 않고 다음 클릭 시 에러 메시지를 표시한다', async () => {
    const { getByTestId, getAllByText } = render(<PlaceStep />);

    fireEvent.press(getByTestId('next-button'));

    await waitFor(() => {
      expect(getAllByText('지점을 선택해주세요')).toHaveLength(3);
    });
    expect(mockNextStep).not.toHaveBeenCalled();
  });
});

describe('PlaceStep — 에러 초기화', () => {
  it('에러가 표시된 상태에서 지점을 다시 선택하면 에러가 초기화된다', async () => {
    const { getByTestId, getAllByText, getByText } = render(<PlaceStep />);

    fireEvent.press(getByTestId('next-button'));
    await waitFor(() => {
      expect(getAllByText('지점을 선택해주세요')).toHaveLength(3);
    });

    fireEvent.press(getAllByText('지점을 선택해주세요')[1]);
    fireEvent.press(getByText('평동'));

    // 지점 선택 후 드롭다운 라벨이 '평동'으로 바뀌어 description 문구만 남는다.
    expect(getAllByText('지점을 선택해주세요')).toHaveLength(1);
    expect(getByText('평동')).toBeTruthy();
  });
});

describe('PlaceStep — 다음 단계로 이동', () => {
  it('지점을 선택한 뒤 다음 클릭 시 updateField와 nextStep이 호출된다', () => {
    const { getAllByText, getByText, getByTestId } = render(<PlaceStep />);

    fireEvent.press(getAllByText('지점을 선택해주세요')[1]);
    fireEvent.press(getByText('평동'));
    fireEvent.press(getByTestId('next-button'));

    expect(mockUpdateField).toHaveBeenCalledWith(11);
    expect(mockNextStep).toHaveBeenCalled();
  });
});
