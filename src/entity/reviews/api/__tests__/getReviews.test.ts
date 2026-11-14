import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { shouldRetryQuery, shouldThrowQueryError } from '~/shared/lib/QueryProvider';
import { getMyReceivedReview, getReceiveReview, getTossReview } from '../getReviews';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

// 요청이 도착한 쿼리 파라미터를 기록하고 주어진 응답을 돌려준다
const captureQuery = (path: string, response: unknown[] = []) => {
  const received = jest.fn();
  server.use(
    http.get(`${BASE}${path}`, ({ request }) => {
      received(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(response as never);
    })
  );
  return received;
};

describe('getReceiveReview', () => {
  it('GET /review/:id 응답 data를 반환한다', async () => {
    const reviews = [{ reviewId: '1', content: '후기' }];
    const received = captureQuery('/review/3', reviews);

    await expect(getReceiveReview('3')).resolves.toEqual(reviews);
    expect(received).toHaveBeenCalledWith({});
  });

  it('params가 있으면 size/cursor를 쿼리 파라미터로 전달한다', async () => {
    const received = captureQuery('/review/3');

    await getReceiveReview('3', { size: 20, cursor: 100 });

    expect(received).toHaveBeenCalledWith({ size: '20', cursor: '100' });
  });

  it('cursor 없이 size만 있으면(첫 페이지) cursor를 보내지 않는다', async () => {
    const received = captureQuery('/review/3');

    await getReceiveReview('3', { size: 20 });

    expect(received).toHaveBeenCalledWith({ size: '20' });
  });

  it('유효하지 않은 id는 요청을 보내지 않고 실패한다', async () => {
    const received = captureQuery('/review/abc');

    await expect(getReceiveReview('abc')).rejects.toThrow();
    expect(received).not.toHaveBeenCalled();
  });
});

describe('getMyReceivedReview', () => {
  it('GET /review/current 응답 data를 반환한다', async () => {
    const reviews = [{ reviewId: '5', content: '내가 받은 후기' }];
    captureQuery('/review/current', reviews);

    await expect(getMyReceivedReview()).resolves.toEqual(reviews);
  });

  it('params가 있으면 size/cursor를 쿼리 파라미터로 전달한다', async () => {
    const received = captureQuery('/review/current');

    await getMyReceivedReview({ size: 20, cursor: 50 });

    expect(received).toHaveBeenCalledWith({ size: '20', cursor: '50' });
  });
});

describe('getTossReview', () => {
  it('GET /review 응답 data를 반환한다', async () => {
    const reviews = [{ reviewId: '2', content: '내가 준 후기' }];
    captureQuery('/review', reviews);

    await expect(getTossReview()).resolves.toEqual(reviews);
  });
});

describe('에러 정책', () => {
  const cases = [
    ['getReceiveReview', '/review/3', () => getReceiveReview('3')],
    ['getMyReceivedReview', '/review/current', () => getMyReceivedReview()],
    ['getTossReview', '/review', () => getTossReview()],
  ] as const;

  it.each(cases)(
    '%s: 4xx는 상태 코드를 유지한 채 던져 재시도하지 않는다',
    async (_, path, call) => {
      server.use(
        http.get(`${BASE}${path}`, () =>
          HttpResponse.json({ message: '후기를 찾을 수 없습니다.' }, { status: 404 })
        )
      );

      const error = await call().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AxiosError);
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as Error).message).toBe('후기를 찾을 수 없습니다.');
      expect(shouldRetryQuery(0, error)).toBe(false);
      expect(shouldThrowQueryError(error, false)).toBe(false);
    }
  );

  it.each(cases)(
    '%s: 5xx는 재시도하고 캐시가 없으면 ErrorBoundary로 보낸다',
    async (_, path, call) => {
      server.use(http.get(`${BASE}${path}`, () => new HttpResponse(null, { status: 500 })));

      const error = await call().catch((e: unknown) => e);

      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldThrowQueryError(error, false)).toBe(true);
    }
  );
});
