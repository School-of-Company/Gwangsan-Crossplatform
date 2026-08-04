import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { TradeRequestModal } from '../index';

jest.mock('~/shared/ui', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, title, onClose }: any) => {
    if (!isVisible) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity testID="modal-close-button" onPress={onClose} />
        {children}
      </View>
    );
  },
  Button: ({ children, onPress, disabled }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled: !!disabled }}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

const defaultProps = {
  isVisible: true,
  onClose: jest.fn(),
  onTradeRequest: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TradeRequestModal', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(<TradeRequestModal {...defaultProps} isVisible={false} />);

    expect(queryByText('거래 요청')).toBeNull();
  });

  it('isVisible=true이면 거래 요청/닫기 버튼을 표시한다', () => {
    const { getByText } = render(<TradeRequestModal {...defaultProps} />);

    expect(getByText('거래 요청')).toBeTruthy();
    expect(getByText('닫기')).toBeTruthy();
  });

  it('닫기 버튼을 누르면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { getByText } = render(<TradeRequestModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByText('닫기'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('거래 요청 버튼을 누르면 onTradeRequest와 onClose가 모두 호출된다', () => {
    const onTradeRequest = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <TradeRequestModal {...defaultProps} onTradeRequest={onTradeRequest} onClose={onClose} />
    );

    fireEvent.press(getByText('거래 요청'));

    expect(onTradeRequest).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('isLoading=true이면 "요청 중..." 텍스트를 표시하고 버튼들이 비활성화된다', () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <TradeRequestModal {...defaultProps} isLoading />
    );

    expect(getByText('요청 중...')).toBeTruthy();
    const actionButtons = UNSAFE_getAllByType(TouchableOpacity).filter(
      (button) => button.props.accessibilityState !== undefined
    );
    expect(actionButtons.length).toBeGreaterThan(0);
    actionButtons.forEach((button) => {
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  it('isLoading=false(기본값)이면 "거래 요청" 텍스트를 표시한다', () => {
    const { getByText } = render(<TradeRequestModal {...defaultProps} />);

    expect(getByText('거래 요청')).toBeTruthy();
  });

  it('모달 닫기(오버레이)로 닫히면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<TradeRequestModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByTestId('modal-close-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
