import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';
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
// needs to render its children, and Gesture.Pan needs to be a chainable stub. 생성된 스텁은
// mockPanStubs에 쌓아 두어, 테스트에서 onStart/onUpdate/onEnd 콜백을 직접 호출할 수 있게 한다.
const mockPanStubs: any[] = [];
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
    mockPanStubs.push(stub);
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
  mockPanStubs.length = 0;
});

// 렌더마다 Pan 제스처가 다시 만들어지므로, 마지막으로 만들어진 세 개(오전/오후·시·분)를 쓴다.
const latestColumns = () => {
  const [period, hour, minute] = mockPanStubs.slice(-3);
  return { period, hour, minute };
};

const drag = (column: any, translationY: number, velocityY = 0) => {
  act(() => {
    column._onStart();
    column._onUpdate({ translationY });
    column._onEnd({ velocityY });
  });
};

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

  describe('휠 드래그', () => {
    it('한 칸 위로 끌면 다음 항목이 선택된다 (오전 → 오후)', () => {
      const onSelect = jest.fn();
      const { getByText } = render(<ReservationTimeSheet {...defaultProps} onSelect={onSelect} />);

      drag(latestColumns().period, -44);
      fireEvent.press(getByText('확인'));

      expect(onSelect).toHaveBeenCalledWith('21:00');
    });

    it('범위를 넘겨 끌면 처음/마지막 항목에서 멈춘다', () => {
      const onSelect = jest.fn();
      const { getByText } = render(
        <ReservationTimeSheet {...defaultProps} selectedTime="15:30" onSelect={onSelect} />
      );

      drag(latestColumns().hour, -10000);
      drag(latestColumns().minute, 10000);
      fireEvent.press(getByText('확인'));

      // 시: 마지막 항목(12시), 분: 첫 항목(00분). 오후 12시는 12:00이다.
      expect(onSelect).toHaveBeenCalledWith('12:00');
    });

    it('손을 뗄 때의 속도만큼 더 넘어가 안착한다', () => {
      const onSelect = jest.fn();
      const { getByText } = render(<ReservationTimeSheet {...defaultProps} onSelect={onSelect} />);

      // 한 칸(44) 끌고 위로 빠르게 놓으면 0.15 * 300 = 45만큼 더 나가 두 칸째(10분)에 멈춘다.
      drag(latestColumns().minute, -44, -300);
      fireEvent.press(getByText('확인'));

      expect(onSelect).toHaveBeenCalledWith('09:10');
    });
  });
});
