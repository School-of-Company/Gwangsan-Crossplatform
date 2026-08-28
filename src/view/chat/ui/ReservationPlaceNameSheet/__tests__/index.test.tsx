import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { ReservationPlaceNameSheet } from '../index';

jest.mock('~/shared/ui/BottomSheetModalWrapper', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, title }: any) => {
    if (!isVisible) return null;
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        {children}
      </View>
    );
  },
}));

// The real `~/shared/ui` barrel also re-exports `Footer`, which pulls in
// `expo-router` - a package this project's Jest/Babel setup cannot transform
// outside of app code (`import ... from 'expo-router'` fails with "Cannot use
// import statement outside a module" because expo-router's internals aren't
// covered by transformIgnorePatterns for this test target). We only need
// Button/Input here, so re-export the real (untouched) implementations
// directly from their own modules to sidestep the barrel entirely.
jest.mock('~/shared/ui', () => ({
  Button: require('~/shared/ui/Button').Button,
  Input: require('~/shared/ui/Input').Input,
}));

const defaultProps = {
  isVisible: true,
  onClose: jest.fn(),
  address: '광주 광산구 상무대로 100',
  placeName: '',
  onChangePlaceName: jest.fn(),
  onConfirm: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReservationPlaceNameSheet', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(
      <ReservationPlaceNameSheet {...defaultProps} isVisible={false} />
    );
    expect(queryByText('장소명 입력')).toBeNull();
  });

  it('address 텍스트를 렌더링한다', () => {
    const { getByText } = render(<ReservationPlaceNameSheet {...defaultProps} />);
    expect(getByText('광주 광산구 상무대로 100')).toBeTruthy();
  });

  it('입력 시 onChangePlaceName이 호출된다', () => {
    const onChangePlaceName = jest.fn();
    const { getByPlaceholderText } = render(
      <ReservationPlaceNameSheet {...defaultProps} onChangePlaceName={onChangePlaceName} />
    );

    fireEvent.changeText(getByPlaceholderText('예: 상무역 2번 출구'), '상무역 2번 출구');

    expect(onChangePlaceName).toHaveBeenCalledWith('상무역 2번 출구');
  });

  it('placeName이 비어있으면 확인 버튼이 비활성화된다', () => {
    const { UNSAFE_getByType } = render(
      <ReservationPlaceNameSheet {...defaultProps} placeName="" />
    );

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
  });

  it('placeName이 공백뿐이면 확인 버튼이 비활성화된다', () => {
    const { UNSAFE_getByType } = render(
      <ReservationPlaceNameSheet {...defaultProps} placeName="   " />
    );

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
  });

  it('placeName이 있으면 확인 버튼이 활성화되고 눌렀을 때 onConfirm이 호출된다', () => {
    const onConfirm = jest.fn();
    const { UNSAFE_getByType } = render(
      <ReservationPlaceNameSheet
        {...defaultProps}
        placeName="상무역 2번 출구"
        onConfirm={onConfirm}
      />
    );

    const confirmButton = UNSAFE_getByType(TouchableOpacity);
    expect(confirmButton.props.disabled).toBe(false);

    fireEvent.press(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
