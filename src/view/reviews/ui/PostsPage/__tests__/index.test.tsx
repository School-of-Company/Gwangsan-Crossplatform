import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  reviewerName: '홍길동',
  content: '좋아요',
  light: 80,
  productId: 1,
  images: [],
  reviewId: '1',
  ...overrides,
});

// mode별로 다른 데이터를 반환하도록 mock을 구성한다 (두 패널이 항상 동시에 렌더링되므로)
const mockReviewsByMode = (
  byMode: Partial<Record<'receive' | 'toss', { data?: unknown[]; isError?: boolean }>>
) => {
  mockUseGetReviews.mockImplementation((mode: 'receive' | 'toss') => ({
    data: byMode[mode]?.data ?? [],
    isError: byMode[mode]?.isError ?? false,
  }));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '1' });
});

describe('ReviewsPageView', () => {
  describe('탭', () => {
    it('헤더는 "후기"를 표시하고, "받은 후기"/"작성한 후기" 탭을 보여준다', () => {
      mockReviewsByMode({});

      const { getByTestId, getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByTestId('header-title').props.children).toBe('후기');
      expect(getByText('받은 후기(active)')).toBeTruthy();
      expect(getByText('작성한 후기')).toBeTruthy();
    });

    it('마운트 시 받은 후기와 작성한 후기를 함께 조회한다 (스와이프 패널이 항상 존재하므로)', () => {
      mockReviewsByMode({});

      render(<ReviewsPageView mode="receive" />);

      expect(mockUseGetReviews).toHaveBeenCalledWith('receive', '1');
      expect(mockUseGetReviews).toHaveBeenCalledWith('toss', '1');
    });

    it('"판매완료" 탭처럼 "작성한 후기" 탭을 누르면 해당 탭이 활성화된다', () => {
      mockReviewsByMode({});

      const { getByTestId, getByText } = render(<ReviewsPageView mode="receive" />);

      fireEvent.press(getByTestId('reviews-tab-toss'));

      expect(getByText('작성한 후기(active)')).toBeTruthy();
    });

    it('작성한 후기 페이지에서 "받은 후기" 탭을 누르면 해당 탭이 활성화된다', () => {
      mockReviewsByMode({});

      const { getByTestId, getByText } = render(<ReviewsPageView mode="toss" />);

      fireEvent.press(getByTestId('reviews-tab-receive'));

      expect(getByText('받은 후기(active)')).toBeTruthy();
    });
  });

  describe('receive 패널', () => {
    it('posts가 있으면 각 리뷰를 렌더링한다', () => {
      mockReviewsByMode({
        receive: { data: [makeReview({ reviewId: '1' }), makeReview({ reviewId: '2' })] },
      });

      const { getAllByTestId } = render(<ReviewsPageView mode="receive" />);

      expect(getAllByTestId('review-post-receive')).toHaveLength(2);
    });

    it('posts가 비어있고 에러가 없으면 안내 텍스트를 표시한다', () => {
      mockReviewsByMode({});

      const { getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByText('받은 후기가 없습니다.')).toBeTruthy();
    });

    it('isError가 true이면 에러 메시지를 표시한다', () => {
      mockReviewsByMode({ receive: { data: [], isError: true } });

      const { getByText } = render(<ReviewsPageView mode="receive" />);

      expect(getByText('후기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')).toBeTruthy();
    });

    it('배열 형태의 id 파라미터는 첫 번째 값을 사용한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: ['9', '10'] });
      mockReviewsByMode({});

      render(<ReviewsPageView mode="receive" />);

      expect(mockUseGetReviews).toHaveBeenCalledWith('receive', '9');
      expect(mockUseGetReviews).toHaveBeenCalledWith('toss', '9');
    });

    it('id 파라미터를 그대로 useGetReviews에 전달한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '42' });
      mockReviewsByMode({});

      render(<ReviewsPageView mode="receive" />);

      expect(mockUseGetReviews).toHaveBeenCalledWith('receive', '42');
    });
  });

  describe('toss 패널', () => {
    it('posts가 있으면 각 리뷰를 렌더링한다', () => {
      mockReviewsByMode({
        toss: { data: [makeReview({ reviewId: '3' })] },
      });

      const { getAllByTestId } = render(<ReviewsPageView mode="toss" />);

      expect(getAllByTestId('review-post-toss')).toHaveLength(1);
    });

    it('posts가 비어있고 에러가 없으면 안내 텍스트를 표시한다', () => {
      mockReviewsByMode({});

      const { getByText } = render(<ReviewsPageView mode="toss" />);

      expect(getByText('작성한 후기가 없습니다.')).toBeTruthy();
    });
  });
});
