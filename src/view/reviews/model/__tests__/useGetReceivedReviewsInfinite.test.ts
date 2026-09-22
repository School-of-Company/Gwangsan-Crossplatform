import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { getMyReceivedReview, getReceiveReview } from '../../api/getReviews';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import {
  useGetReceivedReviewsInfinite,
  RECEIVED_REVIEWS_PAGE_SIZE,
} from '../useGetReceivedReviewsInfinite';

jest.mock('../../api/getReviews', () => ({
  getMyReceivedReview: jest.fn(),
  getReceiveReview: jest.fn(),
}));

jest.mock('~/entity/main/model/useGetMyInformation', () => ({
  useGetMyInformation: jest.fn(),
}));

const mockGetMyReceivedReview = getMyReceivedReview as jest.Mock;
const mockGetReceiveReview = getReceiveReview as jest.Mock;
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

const makePage = (count: number, startId: number) =>
  Array.from({ length: count }, (_, i) => makeReview({ reviewId: String(startId - i) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseGetMyInformation.mockReturnValue({ data: { memberId: 99 } });
});

describe('useGetReceivedReviewsInfinite', () => {
  it('내 memberId면 getMyReceivedReview를 size와 함께 호출한다(첫 요청은 cursor를 생략한다)', async () => {
    mockGetMyReceivedReview.mockResolvedValue(makePage(5, 100));

    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('99'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetMyReceivedReview).toHaveBeenCalledWith({ size: RECEIVED_REVIEWS_PAGE_SIZE });
    expect(mockGetReceiveReview).not.toHaveBeenCalled();
  });

  it('다른 사람 memberId면 getReceiveReview를 호출한다', async () => {
    mockGetReceiveReview.mockResolvedValue(makePage(5, 100));

    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('3'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetReceiveReview).toHaveBeenCalledWith('3', { size: RECEIVED_REVIEWS_PAGE_SIZE });
  });

  it('정확히 size개를 받으면 다음 페이지가 있다고 판단하고, 다음 요청에는 마지막 reviewId를 cursor로 보낸다', async () => {
    mockGetReceiveReview.mockResolvedValueOnce(makePage(RECEIVED_REVIEWS_PAGE_SIZE, 100));

    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('3'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    const lastReviewId = 100 - RECEIVED_REVIEWS_PAGE_SIZE + 1;
    mockGetReceiveReview.mockResolvedValueOnce(makePage(3, lastReviewId - 1));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(mockGetReceiveReview).toHaveBeenLastCalledWith('3', {
      size: RECEIVED_REVIEWS_PAGE_SIZE,
      cursor: lastReviewId,
    });
  });

  it('length가 size보다 작으면 다음 페이지가 없다고 판단한다', async () => {
    mockGetReceiveReview.mockResolvedValue(makePage(3, 100));

    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('3'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('빈 배열을 받으면 다음 페이지가 없다고 판단한다', async () => {
    mockGetReceiveReview.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('3'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('enabled=false로 넘기면 조회하지 않는다', () => {
    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('3', false));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetReceiveReview).not.toHaveBeenCalled();
  });

  it('memberId가 없으면 조회하지 않는다', () => {
    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetReceiveReview).not.toHaveBeenCalled();
  });

  it('내 정보가 아직 없으면 조회하지 않는다', () => {
    mockUseGetMyInformation.mockReturnValue({ data: undefined });

    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('3'));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetReceiveReview).not.toHaveBeenCalled();
  });

  it('판매 목록에서 쓰는 전체 조회 쿼리(reviews/receive/current)와 다른 쿼리키를 사용한다', async () => {
    mockGetMyReceivedReview.mockResolvedValue(makePage(2, 100));

    const { queryClient } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('99'));

    await waitFor(() =>
      expect(
        queryClient.getQueryState([
          'reviews',
          'receive',
          'infinite',
          'current',
          RECEIVED_REVIEWS_PAGE_SIZE,
        ])
      ).toBeDefined()
    );
    expect(queryClient.getQueryState(['reviews', 'receive', 'current'])).toBeUndefined();
  });

  it('API 실패 시 error 상태가 된다', async () => {
    mockGetReceiveReview.mockRejectedValue(new Error('Server error'));

    const { result } = renderHookWithProviders(() => useGetReceivedReviewsInfinite('3'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
