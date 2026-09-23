import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGetReviews } from '../../../model/useGetReviews';
import { useGetReceivedReviewsInfinite } from '../../../model/useGetReceivedReviewsInfinite';
import ReviewsPageView from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../../model/useGetReviews', () => ({
  useGetReviews: jest.fn(),
}));

jest.mock('../../../model/useGetReceivedReviewsInfinite', () => ({
  useGetReceivedReviewsInfinite: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: any) => {
    const { Text } = require('react-native');
    return <Text testID="header-title">{headerTitle}</Text>;
  },
  PillTabs: ({ tabs, value, onChange, testIDPrefix }: any) => {
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View>
        {tabs.map((tab: any) => (
          <TouchableOpacity
            key={tab.value}
            testID={`${testIDPrefix}-${tab.value}`}
            onPress={() => onChange(tab.value)}>
            <Text>{`${tab.label}${tab.value === value ? '(active)' : ''}`}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

jest.mock('~/entity/reviews/ui', () => ({
  ReviewPost: ({ review, mode }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`review-post-${mode}`}>{review.reviewId}</Text>;
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetReviews = useGetReviews as jest.Mock;
const mockUseGetReceivedReviewsInfinite = useGetReceivedReviewsInfinite as jest.Mock;

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  reviewerName: '홍길동',
  content: '좋아요',
  light: 80,
  productId: 1,
  images: [],
  reviewId: '1',
  ...overrides,
});

const mockToss = (options: { data?: unknown[]; isError?: boolean } = {}) => {
  mockUseGetReviews.mockImplementation(() => ({
    data: options.data ?? [],
    isError: options.isError ?? false,
  }));
};

const mockReceiveInfinite = (
  options: {
    pages?: unknown[][];
    isPending?: boolean;
    isError?: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    isFetchNextPageError?: boolean;
    fetchNextPage?: jest.Mock;
  } = {}
) => {
  mockUseGetReceivedReviewsInfinite.mockReturnValue({
    data: { pages: options.pages ?? [] },
    isPending: options.isPending ?? false,
    isError: options.isError ?? false,
    hasNextPage: options.hasNextPage ?? false,
    isFetchingNextPage: options.isFetchingNextPage ?? false,
    isFetchNextPageError: options.isFetchNextPageError ?? false,
    fetchNextPage: options.fetchNextPage ?? jest.fn(),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '1' });
  mockToss();
  mockReceiveInfinite();
});

describe('ReviewsPageView', () => {
  describe('탭', () => {
    it('헤더는 "후기"를 표시하고, "받은 후기"/"작성한 후기" 탭을 보여준다', () => {
      const { getByTestId, getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByTestId('header-title').props.children).toBe('후기');
      expect(getByText('받은 후기(active)')).toBeTruthy();
      expect(getByText('작성한 후기')).toBeTruthy();
    });

    it('마운트 시 활성 탭(받은 후기)만 조회하도록 활성화되고, 비활성 탭(작성한 후기)은 비활성 상태로 호출된다', () => {
      render(<ReviewsPageView mode="receive" />);

      expect(mockUseGetReceivedReviewsInfinite).toHaveBeenCalledWith('1', true);
      expect(mockUseGetReviews).toHaveBeenCalledWith('toss', '1', { enabled: false });
    });

    it('작성한 후기 페이지로 마운트하면 반대로 작성한 후기만 활성화된다', () => {
      render(<ReviewsPageView mode="toss" />);

      expect(mockUseGetReceivedReviewsInfinite).toHaveBeenCalledWith('1', false);
      expect(mockUseGetReviews).toHaveBeenCalledWith('toss', '1', { enabled: true });
    });

    it('"작성한 후기" 탭을 누르면 해당 탭이 활성화되고, 조회 활성 상태도 뒤바뀐다', () => {
      const { getByTestId, getByText } = render(<ReviewsPageView mode="receive" />);

      fireEvent.press(getByTestId('reviews-tab-toss'));

      expect(getByText('작성한 후기(active)')).toBeTruthy();
      expect(mockUseGetReceivedReviewsInfinite).toHaveBeenLastCalledWith('1', false);
      expect(mockUseGetReviews).toHaveBeenLastCalledWith('toss', '1', { enabled: true });
    });

    it('작성한 후기 페이지에서 "받은 후기" 탭을 누르면 해당 탭이 활성화된다', () => {
      const { getByTestId, getByText } = render(<ReviewsPageView mode="toss" />);

      fireEvent.press(getByTestId('reviews-tab-receive'));

      expect(getByText('받은 후기(active)')).toBeTruthy();
      expect(mockUseGetReceivedReviewsInfinite).toHaveBeenLastCalledWith('1', true);
    });
  });

  describe('receive 패널', () => {
    it('로딩 중(isPending)이면 리스트 대신 로딩 인디케이터를 보여준다', () => {
      mockReceiveInfinite({ isPending: true });

      const { queryAllByTestId, UNSAFE_getByType } = render(<ReviewsPageView mode="receive" />);
      const { ActivityIndicator } = require('react-native');

      expect(queryAllByTestId('review-post-receive')).toHaveLength(0);
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('posts가 있으면 각 리뷰를 렌더링한다', () => {
      mockReceiveInfinite({
        pages: [[makeReview({ reviewId: '1' }), makeReview({ reviewId: '2' })]],
      });

      const { getAllByTestId } = render(<ReviewsPageView mode="receive" />);

      expect(getAllByTestId('review-post-receive')).toHaveLength(2);
    });

    it('여러 페이지에 걸쳐 중복된 reviewId가 있으면 한 번만 렌더링한다', () => {
      mockReceiveInfinite({
        pages: [
          [makeReview({ reviewId: '1' }), makeReview({ reviewId: '2' })],
          [makeReview({ reviewId: '2' }), makeReview({ reviewId: '3' })],
        ],
      });

      const { getAllByTestId } = render(<ReviewsPageView mode="receive" />);

      expect(getAllByTestId('review-post-receive')).toHaveLength(3);
    });

    it('posts가 비어있고 에러가 없으면 안내 텍스트를 표시한다', () => {
      const { getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByText('받은 후기가 없습니다.')).toBeTruthy();
    });

    it('isError가 true이면 에러 메시지를 표시한다', () => {
      mockReceiveInfinite({ isError: true });

      const { getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByText('후기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')).toBeTruthy();
    });

    it('배열 형태의 id 파라미터는 첫 번째 값을 사용한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: ['9', '10'] });

      render(<ReviewsPageView mode="receive" />);

      expect(mockUseGetReceivedReviewsInfinite).toHaveBeenCalledWith('9', true);
      expect(mockUseGetReviews).toHaveBeenCalledWith('toss', '9', { enabled: false });
    });

    it('다음 페이지가 있고 끝까지 스크롤하면 fetchNextPage를 호출한다', () => {
      const fetchNextPage = jest.fn();
      mockReceiveInfinite({
        pages: [[makeReview({ reviewId: '1' })]],
        hasNextPage: true,
        fetchNextPage,
      });

      const { getByTestId } = render(<ReviewsPageView mode="receive" />);

      fireEvent(getByTestId('receive-reviews-list'), 'endReached');

      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('다음 페이지 조회 중이면 하단에 로딩 인디케이터를 보여준다', () => {
      mockReceiveInfinite({
        pages: [[makeReview({ reviewId: '1' })]],
        hasNextPage: true,
        isFetchingNextPage: true,
      });

      const { getByTestId } = render(<ReviewsPageView mode="receive" />);

      expect(getByTestId('receive-reviews-next-page-loading')).toBeTruthy();
    });

    it('다음 페이지 조회가 실패하면 다시 시도 버튼을 보여주고, 누르면 fetchNextPage를 다시 호출한다', () => {
      const fetchNextPage = jest.fn();
      mockReceiveInfinite({
        pages: [[makeReview({ reviewId: '1' })]],
        hasNextPage: true,
        isFetchNextPageError: true,
        fetchNextPage,
      });

      const { getByTestId } = render(<ReviewsPageView mode="receive" />);

      fireEvent.press(getByTestId('receive-reviews-retry'));

      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('더 조회할 다음 페이지가 없으면 끝까지 스크롤해도 fetchNextPage를 호출하지 않는다', () => {
      const fetchNextPage = jest.fn();
      mockReceiveInfinite({
        pages: [[makeReview({ reviewId: '1' })]],
        hasNextPage: false,
        fetchNextPage,
      });

      const { getByTestId } = render(<ReviewsPageView mode="receive" />);

      fireEvent(getByTestId('receive-reviews-list'), 'endReached');

      expect(fetchNextPage).not.toHaveBeenCalled();
    });
  });

  describe('toss 패널', () => {
    it('posts가 있으면 각 리뷰를 렌더링한다', () => {
      mockToss({ data: [makeReview({ reviewId: '3' })] });

      const { getAllByTestId } = render(<ReviewsPageView mode="toss" />);

      expect(getAllByTestId('review-post-toss')).toHaveLength(1);
    });

    it('posts가 비어있고 에러가 없으면 안내 텍스트를 표시한다', () => {
      const { getByText } = render(<ReviewsPageView mode="toss" />);

      expect(getByText('작성한 후기가 없습니다.')).toBeTruthy();
    });
  });
});
