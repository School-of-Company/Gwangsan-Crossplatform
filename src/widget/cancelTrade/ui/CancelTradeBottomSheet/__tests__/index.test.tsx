import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useCancelTrade } from '../../../model/useCancelTrade';
import CancelTradeBottomSheet from '../index';

jest.mock('../../../model/useCancelTrade', () => ({
  useCancelTrade: jest.fn(),
}));

jest.mock('~/shared/ui', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, title, onClose }: any) => {
    if (!isVisible) return null;
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity testID="modal-close-button" onPress={onClose} />
        {children}
      </View>
    );
  },
}));

jest.mock('~/shared/ui/TextField', () => ({
  TextField: ({ value, onChangeText, label }: any) => {
    const { TextInput, Text } = require('react-native');
    return (
      <>
        <Text>{label}</Text>
        <TextInput testID="reason-field" value={value} onChangeText={onChangeText} />
      </>
    );
  },
}));

jest.mock('~/shared/ui/Button', () => ({
  Button: ({ children, onPress, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID="submit-button"
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled: !!disabled }}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('~/shared/ui/ImageUploader', () => ({
  __esModule: true,
  default: ({ onImageIdsChange, onUploadStateChange }: any) => {
    const { View, TouchableOpacity } = require('react-native');
    return (
      <View testID="image-uploader">
        <TouchableOpacity
          testID="trigger-image-ids-change"
          onPress={() => onImageIdsChange([1, 2, 3])}
        />
        <TouchableOpacity
          testID="trigger-upload-state-change"
          onPress={() => onUploadStateChange({ hasUploadingImages: false, hasFailedImages: false })}
        />
      </View>
    );
  },
}));

const mockUseCancelTrade = useCancelTrade as jest.Mock;

const makeUseCancelTradeReturn = (overrides = {}) => ({
  reason: '',
  imageIds: [],
  imageUploadState: undefined,
  setReason: jest.fn(),
  setImageIds: jest.fn(),
  setImageUploadState: jest.fn(),
  handleSubmit: jest.fn(),
  resetForm: jest.fn(),
  canSubmit: false,
  isLoading: false,
  ...overrides,
});

const defaultProps = {
  productId: 1,
  isVisible: true,
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn());
});

describe('CancelTradeBottomSheet', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(<CancelTradeBottomSheet {...defaultProps} isVisible={false} />);

    expect(queryByText('거래철회하기')).toBeNull();
  });

  it('isVisible=true이면 "거래철회하기" 타이틀을 표시한다', () => {
    const { getAllByText } = render(<CancelTradeBottomSheet {...defaultProps} />);

    expect(getAllByText('거래철회하기').length).toBeGreaterThan(0);
  });

  it('canSubmit=false이면 제출 버튼이 비활성화된다', () => {
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ canSubmit: false }));

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} />);

    expect(getByTestId('submit-button').props.accessibilityState.disabled).toBe(true);
  });

  it('canSubmit=true이면 제출 버튼이 활성화된다', () => {
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ canSubmit: true }));

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} />);

    expect(getByTestId('submit-button').props.accessibilityState.disabled).toBe(false);
  });

  it('isLoading=true이면 "거래 철회 처리 중..." 텍스트를 표시한다', () => {
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ isLoading: true }));

    const { getByText } = render(<CancelTradeBottomSheet {...defaultProps} />);

    expect(getByText('거래 철회 처리 중...')).toBeTruthy();
  });

  it('이미지 업로드 중이면 "이미지 업로드 중..." 텍스트를 표시한다', () => {
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({
        imageUploadState: { hasUploadingImages: true, hasFailedImages: false },
      })
    );

    const { getByText } = render(<CancelTradeBottomSheet {...defaultProps} />);

    expect(getByText('이미지 업로드 중...')).toBeTruthy();
  });

  it('이미지 업로드 실패 시 "이미지 업로드 실패" 텍스트를 표시한다', () => {
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({
        imageUploadState: { hasUploadingImages: false, hasFailedImages: true },
      })
    );

    const { getByText } = render(<CancelTradeBottomSheet {...defaultProps} />);

    expect(getByText('이미지 업로드 실패')).toBeTruthy();
  });

  it('사유 입력 시 setReason이 호출된다', () => {
    const setReason = jest.fn();
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ setReason }));

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} />);

    fireEvent.changeText(getByTestId('reason-field'), '철회 사유입니다');

    expect(setReason).toHaveBeenCalledWith('철회 사유입니다');
  });

  it('사유가 있는 상태에서 제출하면 handleSubmit이 trim된 값으로 호출된다', () => {
    const handleSubmit = jest.fn();
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({ reason: '  사유  ', canSubmit: true, handleSubmit })
    );

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} />);

    fireEvent.press(getByTestId('submit-button'));

    expect(handleSubmit).toHaveBeenCalledWith('사유');
  });

  it('사유가 공백뿐이면 제출해도 handleSubmit이 호출되지 않는다', () => {
    const handleSubmit = jest.fn();
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({ reason: '   ', canSubmit: true, handleSubmit })
    );

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} />);

    fireEvent.press(getByTestId('submit-button'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('모달 닫기 시 resetForm과 onClose가 호출된다', () => {
    const resetForm = jest.fn();
    const onClose = jest.fn();
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ resetForm }));

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByTestId('modal-close-button'));

    expect(resetForm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('productId와 onSuccess(=onClose)를 useCancelTrade에 전달한다', () => {
    const onClose = jest.fn();

    render(<CancelTradeBottomSheet {...defaultProps} productId={7} onClose={onClose} />);

    expect(mockUseCancelTrade).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 7, onSuccess: onClose })
    );
  });

  it('이미지 ID가 변경되면 setImageIds가 호출된다', () => {
    const setImageIds = jest.fn();
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ setImageIds }));

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} />);

    fireEvent.press(getByTestId('trigger-image-ids-change'));

    expect(setImageIds).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('이미지 업로드 상태가 변경되면 setImageUploadState가 호출된다', () => {
    const setImageUploadState = jest.fn();
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ setImageUploadState }));

    const { getByTestId } = render(<CancelTradeBottomSheet {...defaultProps} />);

    fireEvent.press(getByTestId('trigger-upload-state-change'));

    expect(setImageUploadState).toHaveBeenCalledWith({
      hasUploadingImages: false,
      hasFailedImages: false,
    });
  });
});
