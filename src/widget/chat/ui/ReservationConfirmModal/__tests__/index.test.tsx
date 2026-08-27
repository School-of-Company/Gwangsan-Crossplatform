import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReservationConfirmModal } from '../index';

jest.mock('~/shared/ui', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, onClose }: any) => {
    if (!isVisible) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, TouchableOpacity } = require('react-native');
    return (
      <View>
        <TouchableOpacity testID="modal-close-button" onPress={onClose} />
        {children}
      </View>
    );
  },
  Button: ({ children, onPress }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

const defaultProps = {
  isVisible: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReservationConfirmModal', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(<ReservationConfirmModal {...defaultProps} isVisible={false} />);

    expect(queryByText('예약하기')).toBeNull();
  });

  it('isVisible=true이면 예약하기/닫기 버튼을 표시한다', () => {
    const { getByText } = render(<ReservationConfirmModal {...defaultProps} />);

    expect(getByText('예약하기')).toBeTruthy();
    expect(getByText('닫기')).toBeTruthy();
  });

  it('예약하기 버튼을 누르면 onConfirm이 호출된다', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ReservationConfirmModal {...defaultProps} onConfirm={onConfirm} />
    );

    fireEvent.press(getByText('예약하기'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼을 누르면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { getByText } = render(<ReservationConfirmModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByText('닫기'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('모달 닫기(오버레이)로 닫히면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<ReservationConfirmModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByTestId('modal-close-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
