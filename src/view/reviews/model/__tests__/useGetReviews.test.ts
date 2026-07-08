import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { getReceiveReview, getTossReview } from '../../api/getReviews';
import { useGetReviews } from '../useGetReviews';

jest.mock('../../api/getReviews', () => ({
  getReceiveReview: jest.fn(),
  getTossReview: jest.fn(),
}));

const mockGetReceiveReview = getReceiveReview as jest.Mock;
const mockGetTossReview = getTossReview as jest.Mock;

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  reviewerName: '홍길동',
  content: '좋아요',
  light: 80,
  productId: 1,
  images: [],
  reviewId: '1',
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('useGetReviews', () => {
  describe('receive 모드', () => {
    it('memberId가 있으면 getReceiveReview를 호출하고 데이터를 반환한다', async () => {
      const reviews = [makeReview()];
      mockGetReceiveReview.mockResolvedValue(reviews);

      const { result } = renderHookWithProviders(() => useGetReviews('receive', '3'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetReceiveReview).toHaveBeenCalledWith('3');
      expect(mockGetTossReview).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(reviews);
    });

    it('memberId가 없으면 쿼리가 비활성화된다', () => {
      const { result } = renderHookWithProviders(() => useGetReviews('receive', undefined));

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetReceiveReview).not.toHaveBeenCalled();
    });

    it('memberId가 "undefined" 문자열이면 쿼리가 비활성화된다', () => {
      const { result } = renderHookWithProviders(() => useGetReviews('receive', 'undefined'));

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetReceiveReview).not.toHaveBeenCalled();
    });

    it('API 실패 시 error 상태가 된다', async () => {
      mockGetReceiveReview.mockRejectedValue(new Error('Server error'));

      const { result } = renderHookWithProviders(() => useGetReviews('receive', '3'));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });

    it('queryKey가 [reviews, receive, memberId]이다', async () => {
      mockGetReceiveReview.mockResolvedValue([makeReview()]);

      const { queryClient } = renderHookWithProviders(() => useGetReviews('receive', '7'));

      await waitFor(() =>
        expect(queryClient.getQueryState(['reviews', 'receive', '7'])).toBeDefined()
      );
    });
  });

  describe('toss 모드', () => {
    it('memberId 없이도 getTossReview를 호출하고 데이터를 반환한다', async () => {
      const reviews = [makeReview({ reviewId: '2' })];
      mockGetTossReview.mockResolvedValue(reviews);

      const { result } = renderHookWithProviders(() => useGetReviews('toss'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetTossReview).toHaveBeenCalled();
      expect(mockGetReceiveReview).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(reviews);
    });

    it('API 실패 시 error 상태가 된다', async () => {
      mockGetTossReview.mockRejectedValue(new Error('Network error'));

      const { result } = renderHookWithProviders(() => useGetReviews('toss'));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });

    it('queryKey가 [reviews, toss, null]이다', async () => {
      mockGetTossReview.mockResolvedValue([]);

      const { queryClient } = renderHookWithProviders(() => useGetReviews('toss', '5'));

      await waitFor(() =>
        expect(queryClient.getQueryState(['reviews', 'toss', null])).toBeDefined()
      );
    });
  });
});
