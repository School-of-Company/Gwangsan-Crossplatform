import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCancelTrade } from '~/widget/cancelTrade/model/useCancelTrade';
import { useGetReview } from '../../../model/useGetReview';
import CancelTradeReasonPage from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('~/widget/cancelTrade/model/useCancelTrade', () => ({
  useCancelTrade: jest.fn(),
}));

jest.mock('../../../model/useGetReview', () => ({
  useGetReview: jest.fn(),
}));

jest.mock('~/shared/ui', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return {
    Header: ({ headerTitle }: any) => <Text testID="header-title">{headerTitle}</Text>,
    Button: ({ children, onPress, disabled }: any) => (
      <TouchableOpacity
        testID="cancel-trade-submit-button"
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled: !!disabled }}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('~/shared/ui/TextField', () => ({
  TextField: ({ value, onChangeText }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput testID="reason-text-field" value={value} onChangeText={onChangeText} />;
  },
}));

jest.mock('~/shared/ui/ImageUploader', () => ({
  __esModule: true,
  default: ({ onImageIdsChange, onUploadStateChange }: any) => {
    const { View, TouchableOpacity } = require('react-native');
    return (
      <View testID="image-uploader">
        <TouchableOpacity testID="image-ids-trigger" onPress={() => onImageIdsChange([3])} />
        <TouchableOpacity
          testID="upload-state-trigger"
          onPress={() => onUploadStateChange({ hasUploadingImages: false, hasFailedImages: false })}
        />
      </View>
    );
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseCancelTrade = useCancelTrade as jest.Mock;
const mockUseGetReview = useGetReview as jest.Mock;
const mockBack = jest.fn();

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
  error: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '1' });
  mockUseRouter.mockReturnValue({ back: mockBack });
  mockUseGetReview.mockReturnValue({ data: { reviewId: 1, productId: 10 } });
  mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn());
});

describe('CancelTradeReasonPage', () => {
  it('"거래취소하기" 헤더를 표시한다', () => {
    const { getByTestId } = render(<CancelTradeReasonPage />);

    expect(getByTestId('header-title').props.children).toBe('거래취소하기');
  });

  it('리뷰 상세의 productId를 useCancelTrade에 전달한다', () => {
    render(<CancelTradeReasonPage />);

    expect(mockUseGetReview).toHaveBeenCalledWith('1');
    expect(mockUseCancelTrade).toHaveBeenCalledWith(expect.objectContaining({ productId: 10 }));
  });

  it('거래취소가 성공하면 이전 화면으로 돌아간다', () => {
    render(<CancelTradeReasonPage />);

    const { onSuccess } = mockUseCancelTrade.mock.calls[0][0];
    onSuccess();

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('canSubmit=false이면 제출 버튼이 비활성화된다', () => {
    const { getByTestId } = render(<CancelTradeReasonPage />);

    expect(getByTestId('cancel-trade-submit-button').props.accessibilityState.disabled).toBe(true);
  });

  it('canSubmit=true이면 제출 버튼이 활성화된다', () => {
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ canSubmit: true }));

    const { getByTestId } = render(<CancelTradeReasonPage />);

    expect(getByTestId('cancel-trade-submit-button').props.accessibilityState.disabled).toBe(false);
  });

  it('isLoading=true이면 "거래 취소 처리 중..." 텍스트를 표시한다', () => {
    mockUseCancelTrade.mockReturnValue(makeUseCancelTradeReturn({ isLoading: true }));

    const { getByText } = render(<CancelTradeReasonPage />);

    expect(getByText('거래 취소 처리 중...')).toBeTruthy();
  });

  it('이미지 업로드 중이면 "이미지 업로드 중..." 텍스트를 표시한다', () => {
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({
        imageUploadState: { hasUploadingImages: true, hasFailedImages: false },
      })
    );

    const { getByText } = render(<CancelTradeReasonPage />);

    expect(getByText('이미지 업로드 중...')).toBeTruthy();
  });

  it('사유가 있으면 제출 시 trim된 사유로 handleSubmit이 호출된다', () => {
    const handleSubmit = jest.fn();
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({
        reason: '  물건이 오지 않았어요  ',
        canSubmit: true,
        handleSubmit,
      })
    );

    const { getByTestId } = render(<CancelTradeReasonPage />);

    fireEvent.press(getByTestId('cancel-trade-submit-button'));

    expect(handleSubmit).toHaveBeenCalledWith('물건이 오지 않았어요');
  });

  it('사유가 공백뿐이면 제출해도 handleSubmit이 호출되지 않는다', () => {
    const handleSubmit = jest.fn();
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({ reason: '   ', canSubmit: true, handleSubmit })
    );

    const { getByTestId } = render(<CancelTradeReasonPage />);

    fireEvent.press(getByTestId('cancel-trade-submit-button'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('이미지 업로드 결과가 useCancelTrade로 전달된다', () => {
    const setImageIds = jest.fn();
    const setImageUploadState = jest.fn();
    mockUseCancelTrade.mockReturnValue(
      makeUseCancelTradeReturn({ setImageIds, setImageUploadState })
    );

    const { getByTestId } = render(<CancelTradeReasonPage />);

    fireEvent.press(getByTestId('image-ids-trigger'));
    fireEvent.press(getByTestId('upload-state-trigger'));

    expect(setImageIds).toHaveBeenCalledWith([3]);
    expect(setImageUploadState).toHaveBeenCalledWith(
      expect.objectContaining({ hasUploadingImages: false, hasFailedImages: false })
    );
  });
});
