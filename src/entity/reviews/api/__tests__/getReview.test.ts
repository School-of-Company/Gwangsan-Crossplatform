import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { shouldRetryQuery, shouldThrowQueryError } from '~/shared/lib/QueryProvider';
import { createAxiosError } from '~/test-utils/axiosError';
import { getReview } from '../getReview';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getReview', () => {
  it('GET /review/detail/:id 응답 data를 반환한다', async () => {
    const reviewData = {
      reviewId: 1,
      productId: 10,
      title: '좋아요',
      content: '만족',
      light: 80,
      imageUrls: [],
    };
    mockGet.mockResolvedValue({ data: reviewData });

    const result = await getReview('1');

    expect(mockGet).toHaveBeenCalledWith('/review/detail/1');
    expect(result).toEqual(reviewData);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));

    await expect(getReview('999')).rejects.toThrow('Not found');
  });

  it('4xx는 상태 코드를 유지한 채 던져 재시도하지 않는다', async () => {
    mockGet.mockRejectedValue(createAxiosError(404, { message: '후기를 찾을 수 없습니다.' }));

    const error = await getReview('999').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(404);
    expect((error as Error).message).toBe('후기를 찾을 수 없습니다.');
    expect(shouldRetryQuery(0, error)).toBe(false);
    expect(shouldThrowQueryError(error, false)).toBe(false);
  });

  it('5xx는 재시도하고 캐시가 없으면 ErrorBoundary로 보낸다', async () => {
    mockGet.mockRejectedValue(createAxiosError(503));

    const error = await getReview('1').catch((e: unknown) => e);

    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldThrowQueryError(error, false)).toBe(true);
  });
});
