import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { ReservationModal } from '../index';

jest.mock('~/shared/ui', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Dropdown } = require('~/shared/ui/Dropdown');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Input } = require('~/shared/ui/Input');

  return {
    Dropdown,
    Input,
    BottomSheetModalWrapper: ({ isVisible, children, title, onClose }: any) => {
      if (!isVisible) return null;
      return (
        <View>
          <Text>{title}</Text>
          <TouchableOpacity testID="modal-close-button" onPress={onClose} />
          {children}
        </View>
      );
    },
    Button: ({ children, onPress, disabled }: any) => (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled: !!disabled }}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');

const defaultProps = {
  isVisible: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

const fillForm = (getByText: any, getByPlaceholderText: any) => {
  fireEvent.press(getByText('날짜를 선택해주세요'));
  fireEvent.press(getByText('오늘', { exact: false }));

  fireEvent.press(getByText('시간을 선택해주세요'));
  fireEvent.press(getByText('09:00'));

  fireEvent.changeText(getByPlaceholderText('예: 상무역 2번 출구'), '상무역 2번 출구');
  fireEvent.changeText(
    getByPlaceholderText('예: 광주 서구 상무자유로 20'),
    '광주 서구 상무자유로 20'
  );
};

describe('ReservationModal', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(<ReservationModal {...defaultProps} isVisible={false} />);

    expect(queryByText('예약 정보 입력')).toBeNull();
  });

  it('날짜/시간/장소/주소를 모두 입력하기 전에는 예약하기 버튼이 비활성화된다', () => {
    const { UNSAFE_getAllByType } = render(<ReservationModal {...defaultProps} />);

    const actionButtons = UNSAFE_getAllByType(TouchableOpacity).filter(
      (button) => button.props.accessibilityState !== undefined
    );
    expect(actionButtons.length).toBeGreaterThan(0);
    expect(actionButtons[0].props.accessibilityState.disabled).toBe(true);
  });

  it('모든 값을 입력하면 예약하기 버튼을 눌러 scheduledAt/placeName/address를 onConfirm으로 전달한다', () => {
    const onConfirm = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <ReservationModal {...defaultProps} onConfirm={onConfirm} />
    );

    fillForm(getByText, getByPlaceholderText);

    fireEvent.press(getByText('예약하기'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const payload = onConfirm.mock.calls[0][0];
    expect(payload.placeName).toBe('상무역 2번 출구');
    expect(payload.address).toBe('광주 서구 상무자유로 20');
    expect(payload.scheduledAt).toMatch(/^\d{4}-\d{2}-\d{2}T09:00:00$/);
  });

  it('닫기 버튼을 누르면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { getByText } = render(<ReservationModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByText('닫기'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('isLoading=true이면 "예약 중..." 텍스트를 표시한다', () => {
    const { getByText } = render(<ReservationModal {...defaultProps} isLoading />);

    expect(getByText('예약 중...')).toBeTruthy();
  });
});
