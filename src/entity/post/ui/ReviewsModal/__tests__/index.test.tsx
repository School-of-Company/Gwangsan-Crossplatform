import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReviewsModal from '../index';

jest.mock('~/shared/ui', () => ({
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
  ProgressBar: ({ value, onChange }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="progress-bar">
        <TouchableOpacity testID="progress-bar-increase" onPress={() => onChange(value + 10)} />
        <Text testID="progress-bar-value">{value}</Text>
      </View>
    );
  },
}));

jest.mock('~/shared/ui/TextField', () => ({
  TextField: ({ value, onChangeText }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput testID="review-text-field" value={value} onChangeText={onChangeText} />;
  },
}));

jest.mock('~/shared/ui/Button', () => ({
  Button: ({ children, onPress, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="submit-button" onPress={onPress} disabled={disabled}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

const defaultProps = {
  isVisible: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  light: 60,
  setLight: jest.fn(),
  contents: '',
  onContentsChange: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ReviewsModal', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(<ReviewsModal {...defaultProps} isVisible={false} />);

    expect(queryByText('후기 작성')).toBeNull();
  });

  it('isVisible=true이면 "후기 작성" 타이틀을 표시한다', () => {
    const { getByText } = render(<ReviewsModal {...defaultProps} />);

    expect(getByText('후기 작성')).toBeTruthy();
  });

  it('"작성완료" 버튼을 표시한다', () => {
    const { getByText } = render(<ReviewsModal {...defaultProps} />);

    expect(getByText('작성완료')).toBeTruthy();
  });

  it('내용이 비어있으면 "작성완료" 눌러도 onSubmit이 호출되지 않는다', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ReviewsModal {...defaultProps} contents="" onSubmit={onSubmit} />
    );

    fireEvent.press(getByTestId('submit-button'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('내용이 있으면 "작성완료" 누를 때 onSubmit이 light와 내용으로 호출된다', () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ReviewsModal
        {...defaultProps}
        contents="좋은 거래였어요"
        light={70}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId('submit-button'));

    expect(onSubmit).toHaveBeenCalledWith(70, '좋은 거래였어요');
    expect(onClose).toHaveBeenCalled();
  });

  it('내용을 입력하고 제출하면 입력한 내용이 onSubmit에 전달된다', () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ReviewsModal {...defaultProps} contents="" onSubmit={onSubmit} onClose={onClose} />
    );

    fireEvent.changeText(getByTestId('review-text-field'), '정말 좋았어요');
    fireEvent.press(getByTestId('submit-button'));

    expect(onSubmit).toHaveBeenCalledWith(60, '정말 좋았어요');
  });

  it('내용 앞뒤 공백은 trim 처리된다', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ReviewsModal {...defaultProps} contents="  공백 포함  " onSubmit={onSubmit} />
    );

    fireEvent.press(getByTestId('submit-button'));

    expect(onSubmit).toHaveBeenCalledWith(60, '공백 포함');
  });

  it('ProgressBar 값이 변경되면 localLight가 업데이트되고 submit에 반영된다', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ReviewsModal {...defaultProps} contents="후기 내용" light={60} onSubmit={onSubmit} />
    );

    fireEvent.press(getByTestId('progress-bar-increase'));
    fireEvent.press(getByTestId('submit-button'));

    expect(onSubmit).toHaveBeenCalledWith(70, '후기 내용');
  });
});
