import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { shouldRetryQuery, shouldThrowQueryError } from '~/shared/lib/QueryProvider';
import { getReview } from '../getReview';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

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
    const requested = jest.fn();
    server.use(
      http.get(`${BASE}/review/detail/:id`, ({ params }) => {
        requested(params.id);
        return HttpResponse.json(reviewData);
      })
    );

    await expect(getReview('1')).resolves.toEqual(reviewData);
    expect(requested).toHaveBeenCalledWith('1');
  });

  it('4xx는 상태 코드를 유지한 채 던져 재시도하지 않는다', async () => {
    server.use(
      http.get(`${BASE}/review/detail/999`, () =>
        HttpResponse.json({ message: '후기를 찾을 수 없습니다.' }, { status: 404 })
      )
    );

    const error = await getReview('999').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(404);
    expect((error as Error).message).toBe('후기를 찾을 수 없습니다.');
    expect(shouldRetryQuery(0, error)).toBe(false);
    expect(shouldThrowQueryError(error, false)).toBe(false);
  });

  it('5xx는 재시도하고 캐시가 없으면 ErrorBoundary로 보낸다', async () => {
    server.use(http.get(`${BASE}/review/detail/1`, () => new HttpResponse(null, { status: 503 })));

    const error = await getReview('1').catch((e: unknown) => e);

    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldThrowQueryError(error, false)).toBe(true);
  });
});
