import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGetReview } from '../../../model/useGetReview';
import { logger } from '~/shared/lib/logger';
import CancelTradeView from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: { back: jest.fn() },
}));

jest.mock('../../../model/useGetReview', () => ({
  useGetReview: jest.fn(),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

jest.mock('~/widget/cancelTrade/ui/CancelTradeBottomSheet', () => {
  const { Text } = require('react-native');
  return function MockCancelTradeBottomSheet({ isVisible, productId }: any) {
    return <Text testID="bottom-sheet">{`${isVisible}-${productId ?? 'none'}`}</Text>;
  };
});

jest.mock('~/shared/ui', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return {
    Header: ({ headerTitle }: any) => <Text testID="header-title">{headerTitle}</Text>,
    Button: ({ children, disabled, onPress }: any) => (
      <TouchableOpacity disabled={disabled} onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetReview = useGetReview as jest.Mock;
const mockLoggerWarn = logger.warn as jest.Mock;

const makeReviewData = (overrides: Record<string, unknown> = {}) => ({
  reviewId: 1,
  productId: 10,
  title: '좋은 거래였어요',
  content: '만족스러운 거래',
  light: 60,
  imageUrls: [],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '1' });
});

describe('CancelTradeView', () => {
  it('id 파라미터를 useGetReview에 전달한다', () => {
    mockUseGetReview.mockReturnValue({ data: undefined });

    render(<CancelTradeView />);

    expect(mockUseGetReview).toHaveBeenCalledWith('1');
  });

  it('id 파라미터가 없으면 빈 문자열을 전달한다', () => {
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseGetReview.mockReturnValue({ data: undefined });

    render(<CancelTradeView />);

    expect(mockUseGetReview).toHaveBeenCalledWith('');
  });

  it('data가 없으면 기본 로고 이미지를 표시하고 철회 버튼이 비활성화된다', () => {
    mockUseGetReview.mockReturnValue({ data: undefined });

    const { getByText } = render(<CancelTradeView />);

    expect(getByText('철회하기')).toBeTruthy();
  });

  it('imageUrls가 문자열 배열이면 각 이미지를 렌더링한다', () => {
    mockUseGetReview.mockReturnValue({
      data: makeReviewData({ imageUrls: ['https://a.com/1.png', 'https://a.com/2.png'] }),
    });

    const { UNSAFE_getAllByType } = render(<CancelTradeView />);
    const { Image } = require('react-native');

    expect(UNSAFE_getAllByType(Image)).toHaveLength(2);
  });

  it('imageUrls가 {url} 또는 {uri} 객체 배열이어도 정상 렌더링한다', () => {
    mockUseGetReview.mockReturnValue({
      data: makeReviewData({
        imageUrls: [{ url: 'https://a.com/1.png' }, { uri: 'https://a.com/2.png' }],
      }),
    });

    const { UNSAFE_getAllByType } = render(<CancelTradeView />);
    const { Image } = require('react-native');

    expect(UNSAFE_getAllByType(Image)).toHaveLength(2);
  });

  it('imageUrls가 비어있으면 기본 로고 하나만 렌더링한다', () => {
    mockUseGetReview.mockReturnValue({ data: makeReviewData({ imageUrls: [] }) });

    const { UNSAFE_getAllByType } = render(<CancelTradeView />);
    const { Image } = require('react-native');

    expect(UNSAFE_getAllByType(Image)).toHaveLength(1);
  });

  it('title과 content를 렌더링한다', () => {
    mockUseGetReview.mockReturnValue({
      data: makeReviewData({ title: '제목입니다', content: '내용입니다' }),
    });

    const { getByText } = render(<CancelTradeView />);

    expect(getByText('제목입니다')).toBeTruthy();
    expect(getByText('내용입니다')).toBeTruthy();
  });

  it('productId가 없으면 logger.warn을 호출한다', () => {
    mockUseGetReview.mockReturnValue({
      data: makeReviewData({ productId: undefined, reviewId: 5 }),
    });

    render(<CancelTradeView />);

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      '리뷰 상세 응답에 productId가 없어 거래철회를 진행할 수 없습니다',
      { reviewId: 5 }
    );
  });

  it('productId가 있으면 logger.warn을 호출하지 않는다', () => {
    mockUseGetReview.mockReturnValue({ data: makeReviewData({ productId: 10 }) });

    render(<CancelTradeView />);

    expect(mockLoggerWarn).not.toHaveBeenCalled();
  });

  it('data가 없으면 logger.warn을 호출하지 않는다', () => {
    mockUseGetReview.mockReturnValue({ data: undefined });

    render(<CancelTradeView />);

    expect(mockLoggerWarn).not.toHaveBeenCalled();
  });

  it('철회하기 버튼을 누르면 CancelTradeBottomSheet의 isVisible이 토글된다', () => {
    mockUseGetReview.mockReturnValue({ data: makeReviewData({ productId: 10 }) });

    const { getByText, getByTestId } = render(<CancelTradeView />);

    expect(getByTestId('bottom-sheet').props.children).toBe('false-10');

    fireEvent.press(getByText('철회하기'));

    expect(getByTestId('bottom-sheet').props.children).toBe('true-10');
  });

  it('productId가 없으면 철회하기 버튼이 disabled 상태다', () => {
    mockUseGetReview.mockReturnValue({ data: makeReviewData({ productId: undefined }) });

    const { getByText } = render(<CancelTradeView />);

    fireEvent.press(getByText('철회하기'));

    // disabled 버튼은 onPress가 무시되어 바텀시트가 열리지 않아야 한다
    expect(getByText('철회하기')).toBeTruthy();
  });
});
