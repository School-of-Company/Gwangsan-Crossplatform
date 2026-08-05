import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { getMyReceivedReview, getReceiveReview, getTossReview } from '../../api/getReviews';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import { useGetReviews } from '../useGetReviews';

jest.mock('../../api/getReviews', () => ({
  getMyReceivedReview: jest.fn(),
  getReceiveReview: jest.fn(),
  getTossReview: jest.fn(),
}));

jest.mock('~/entity/main/model/useGetMyInformation', () => ({
  useGetMyInformation: jest.fn(),
}));

const mockGetMyReceivedReview = getMyReceivedReview as jest.Mock;
const mockGetReceiveReview = getReceiveReview as jest.Mock;
const mockGetTossReview = getTossReview as jest.Mock;
const mockUseGetMyInformation = useGetMyInformation as jest.Mock;

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
  mockUseGetMyInformation.mockReturnValue({ data: { memberId: 99 } });
});

describe('useGetReviews', () => {
  describe('receive 모드', () => {
    it('내 memberId면 getMyReceivedReview(/review/current)를 호출한다', async () => {
      const reviews = [makeReview({ reviewId: '9' })];
      mockGetMyReceivedReview.mockResolvedValue(reviews);

      const { result, queryClient } = renderHookWithProviders(() => useGetReviews('receive', '99'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetMyReceivedReview).toHaveBeenCalled();
      expect(mockGetReceiveReview).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(reviews);
      expect(queryClient.getQueryState(['reviews', 'receive', 'current'])).toBeDefined();
    });

    it('내 정보가 아직 없으면 쿼리가 비활성화된다', () => {
      mockUseGetMyInformation.mockReturnValue({ data: undefined });

      const { result } = renderHookWithProviders(() => useGetReviews('receive', '3'));

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetReceiveReview).not.toHaveBeenCalled();
      expect(mockGetMyReceivedReview).not.toHaveBeenCalled();
    });

    it('다른 사람 memberId면 getReceiveReview를 호출하고 데이터를 반환한다', async () => {
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
