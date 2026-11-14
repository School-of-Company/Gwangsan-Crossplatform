import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { shouldRetryQuery, shouldThrowQueryError } from '~/shared/lib/QueryProvider';
import { getSellingPosts, SELLING_PAGE_SIZE } from '../getSellingPosts';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

// 요청이 도착한 경로와 쿼리 파라미터를 기록하고 주어진 응답을 돌려준다
const captureRequest = (path: string, response: unknown = []) => {
  const received = jest.fn();
  server.use(
    http.get(`${BASE}${path}`, ({ request }) => {
      received(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(response as never);
    })
  );
  return received;
};

describe('getSellingPosts', () => {
  it('본인 목록은 /post/current를 mode=GIVER, 기본 size와 함께 조회한다', async () => {
    const received = captureRequest('/post/current');

    await getSellingPosts({});

    expect(received).toHaveBeenCalledWith({ mode: 'GIVER', size: String(SELLING_PAGE_SIZE) });
  });

  it('다른 회원 목록은 /post/member/{id}를 조회한다', async () => {
    const received = captureRequest('/post/member/5');

    await getSellingPosts({ memberId: '5' });

    expect(received).toHaveBeenCalledWith({ mode: 'GIVER', size: String(SELLING_PAGE_SIZE) });
  });

  it('첫 요청에는 last_id를 보내지 않는다', async () => {
    const received = captureRequest('/post/current');

    await getSellingPosts({ completed: false, lastId: null });

    expect(received).toHaveBeenCalledWith({
      mode: 'GIVER',
      size: String(SELLING_PAGE_SIZE),
      completed: 'false',
    });
  });

  it('다음 요청에는 last_id와 completed, size를 함께 보낸다', async () => {
    const received = captureRequest('/post/current');

    await getSellingPosts({ completed: true, lastId: 42, size: 10 });

    expect(received).toHaveBeenCalledWith({
      mode: 'GIVER',
      size: '10',
      completed: 'true',
      last_id: '42',
    });
  });

  it('type이 있으면 함께 전달한다', async () => {
    const received = captureRequest('/post/current');

    await getSellingPosts({ type: 'SERVICE' });

    expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: 'SERVICE' }));
  });

  it('응답 배열을 그대로 반환한다', async () => {
    const posts = [{ id: 2 }, { id: 1 }];
    captureRequest('/post/current', posts);

    await expect(getSellingPosts({})).resolves.toEqual(posts);
  });

  it('배열이 아닌 응답은 빈 배열로 보정한다', async () => {
    captureRequest('/post/current', null);

    await expect(getSellingPosts({})).resolves.toEqual([]);
  });

  it('실패 시 서버 메시지로 변환된 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/post/current`, () =>
        HttpResponse.json({ message: '게시글을 찾을 수 없습니다.' }, { status: 404 })
      )
    );

    await expect(getSellingPosts({})).rejects.toThrow('게시글을 찾을 수 없습니다.');
  });

  it('4xx는 상태 코드를 유지한 채 던져 재시도하지 않는다', async () => {
    server.use(
      http.get(`${BASE}/post/current`, () =>
        HttpResponse.json({ message: '게시글을 찾을 수 없습니다.' }, { status: 404 })
      )
    );

    const error = await getSellingPosts({}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(404);
    expect(shouldRetryQuery(0, error)).toBe(false);
    expect(shouldThrowQueryError(error, false)).toBe(false);
  });

  it('5xx는 재시도하고 캐시가 없으면 ErrorBoundary로 보낸다', async () => {
    server.use(http.get(`${BASE}/post/current`, () => new HttpResponse(null, { status: 500 })));

    const error = await getSellingPosts({}).catch((e: unknown) => e);

    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldThrowQueryError(error, false)).toBe(true);
  });
});
