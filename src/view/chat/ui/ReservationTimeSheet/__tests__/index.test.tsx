import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReservationTimeSheet } from '../index';

jest.mock('~/shared/ui/BottomSheetModalWrapper', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, onClose }: any) => {
    if (!isVisible) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, TouchableOpacity } = require('react-native');
    return (
      <View>
        <TouchableOpacity testID="sheet-close" onPress={onClose} />
        {children}
      </View>
    );
  },
}));

// react-native-gesture-handler has no existing mock in this repo. GestureDetector just
// needs to render its children, and Gesture.Pan needs to be a chainable stub — the
// actual pan-handling business logic (onStart/onUpdate/onEnd bodies) is gesture
// plumbing, not something worth simulating here.
jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const createPanStub = () => {
    const stub: any = {};
    ['onStart', 'onUpdate', 'onEnd'].forEach((method) => {
      stub[method] = (cb: any) => {
        stub[`_${method}`] = cb;
        return stub;
      };
    });
    return stub;
  };

  return {
    GestureDetector: ({ children }: any) => <View>{children}</View>,
    Gesture: { Pan: createPanStub },
  };
});

const defaultProps = {
  isVisible: true,
  onClose: jest.fn(),
  onSelect: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReservationTimeSheet', () => {
  it('isVisible=false이면 TimeWheels를 마운트하지 않는다', () => {
    const { queryByText } = render(<ReservationTimeSheet {...defaultProps} isVisible={false} />);

    expect(queryByText('오전')).toBeNull();
    expect(queryByText('확인')).toBeNull();
  });

  it('isVisible=true이면 오전/오후, 시, 분 휠 라벨을 렌더링한다', () => {
    const { getByText } = render(<ReservationTimeSheet {...defaultProps} selectedTime="09:00" />);

    expect(getByText('오전')).toBeTruthy();
    expect(getByText('오후')).toBeTruthy();
    expect(getByText('1시')).toBeTruthy();
    expect(getByText('12시')).toBeTruthy();
    expect(getByText('00분')).toBeTruthy();
    expect(getByText('55분')).toBeTruthy();
  });

  it('시트를 직접 닫으면(오버레이) onClose만 호출되고 onSelect는 호출되지 않는다', () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <ReservationTimeSheet {...defaultProps} onClose={onClose} onSelect={onSelect} />
    );

    fireEvent.press(getByTestId('sheet-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  describe('selectedTime prop에 따른 확인 시 onSelect 값', () => {
    const cases: [string | undefined, string][] = [
      [undefined, '09:00'],
      ['09:00', '09:00'],
      ['13:30', '13:30'],
      ['00:15', '00:15'],
      ['23:55', '23:55'],
      // 분이 5분 단위로 반올림되어 60이 되는 경우 0으로 wrap 되는 분기
      ['09:58', '09:00'],
    ];

    it.each(cases)('selectedTime=%s -> 확인 시 onSelect(%s)', (selectedTime, expected) => {
      const onSelect = jest.fn();
      const onClose = jest.fn();
      const { getByText } = render(
        <ReservationTimeSheet
          {...defaultProps}
          selectedTime={selectedTime}
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      fireEvent.press(getByText('확인'));

      expect(onSelect).toHaveBeenCalledWith(expected);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
