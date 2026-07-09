import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGetReviews } from '../../../model/useGetReviews';
import ReviewsPageView from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../../model/useGetReviews', () => ({
  useGetReviews: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: any) => {
    const { Text } = require('react-native');
    return <Text testID="header-title">{headerTitle}</Text>;
  },
}));

jest.mock('~/entity/reviews/ui', () => ({
  ReviewPost: ({ review }: any) => {
    const { Text } = require('react-native');
    return <Text testID="review-post">{review.reviewId}</Text>;
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetReviews = useGetReviews as jest.Mock;

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  reviewerName: '홍길동',
  content: '좋아요',
  light: 80,
  productId: 1,
  images: [],
  reviewId: '1',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '1' });
});

describe('ReviewsPageView', () => {
  describe('receive 모드', () => {
    it('헤더에 "받은 후기"를 표시한다', () => {
      mockUseGetReviews.mockReturnValue({ data: [], isError: false });

      const { getByTestId } = render(<ReviewsPageView mode="receive" />);

      expect(getByTestId('header-title').props.children).toBe('받은 후기');
    });

    it('posts가 있으면 각 리뷰를 렌더링한다', () => {
      const posts = [makeReview({ reviewId: '1' }), makeReview({ reviewId: '2' })];
      mockUseGetReviews.mockReturnValue({ data: posts, isError: false });

      const { getAllByTestId } = render(<ReviewsPageView mode="receive" />);

      expect(getAllByTestId('review-post')).toHaveLength(2);
    });

    it('posts가 비어있고 에러가 없으면 안내 텍스트를 표시한다', () => {
      mockUseGetReviews.mockReturnValue({ data: [], isError: false });

      const { getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByText('표시할 리뷰가 없습니다.')).toBeTruthy();
    });

    it('isError가 true이면 에러 메시지를 표시한다', () => {
      mockUseGetReviews.mockReturnValue({ data: undefined, isError: true });

      const { getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByText('후기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')).toBeTruthy();
    });

    it('배열 형태의 id 파라미터는 첫 번째 값을 사용한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: ['9', '10'] });
      mockUseGetReviews.mockReturnValue({ data: [], isError: false });

      render(<ReviewsPageView mode="receive" />);

      expect(mockUseGetReviews).toHaveBeenCalledWith('receive', '9');
    });

    it('id 파라미터를 그대로 useGetReviews에 전달한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '42' });
      mockUseGetReviews.mockReturnValue({ data: [], isError: false });

      render(<ReviewsPageView mode="receive" />);

      expect(mockUseGetReviews).toHaveBeenCalledWith('receive', '42');
    });
  });

  describe('toss 모드', () => {
    it('헤더에 "작성한 후기"를 표시한다', () => {
      mockUseGetReviews.mockReturnValue({ data: [], isError: false });

      const { getByTestId } = render(<ReviewsPageView mode="toss" />);

      expect(getByTestId('header-title').props.children).toBe('작성한 후기');
    });

    it('useGetReviews를 toss 모드로 호출한다', () => {
      mockUseGetReviews.mockReturnValue({ data: [], isError: false });

      render(<ReviewsPageView mode="toss" />);

      expect(mockUseGetReviews).toHaveBeenCalledWith('toss', '1');
    });
  });
});
