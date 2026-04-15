import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { getReview } from '../api/getReview';
import { useGetReview } from '../model/useGetReview';

jest.mock('../api/getReview', () => ({
  getReview: jest.fn(),
}));

const mockGetReview = getReview as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getReview', () => {
  it('getReview를 호출하면 응답 data를 반환한다', async () => {
    const reviewData = { review_id: 1, title: '좋아요', content: '만족', light: 80, imageUrls: [] };
    mockGetReview.mockResolvedValue(reviewData);

    const result = await getReview('1');

    expect(mockGetReview).toHaveBeenCalledWith('1');
    expect(result).toEqual(reviewData);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGetReview.mockRejectedValue(new Error('Not found'));

    await expect(getReview('999')).rejects.toThrow('Not found');
  });
});

describe('useGetReview', () => {
  it('id가 있으면 getReview를 호출하고 데이터를 반환한다', async () => {
    const reviewData = { review_id: 1, title: '좋아요', content: '만족', light: 80, imageUrls: [] };
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
