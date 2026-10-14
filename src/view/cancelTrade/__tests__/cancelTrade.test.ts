import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { getReview } from '../api/getReview';
import { useGetReview } from '../model/useGetReview';

jest.mock('../api/getReview', () => ({
  getReview: jest.fn(),
}));

const mockGetReview = getReview as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// getReview API 자체(instance.get 호출 등)의 실제 동작 검증은
// src/view/cancelTrade/api/__tests__/getReview.api.test.ts 에서 수행한다.

describe('useGetReview', () => {
  it('id가 있으면 getReview를 호출하고 데이터를 반환한다', async () => {
    const reviewData = {
      reviewId: 1,
      productId: 10,
      title: '좋아요',
      content: '만족',
      light: 80,
      imageUrls: [],
    };
    mockGetReview.mockResolvedValue(reviewData);

    const { result } = renderHookWithProviders(() => useGetReview('1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetReview).toHaveBeenCalledWith('1');
    expect(result.current.data).toEqual(reviewData);
  });

  it('id가 빈 문자열이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetReview(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetReview).not.toHaveBeenCalled();
  });

  it('queryKey가 [review, id]이다', async () => {
    mockGetReview.mockResolvedValue({});

    const { queryClient } = renderHookWithProviders(() => useGetReview('5'));

    await waitFor(() => expect(queryClient.getQueryState(['review', '5'])).toBeDefined());
  });
});
