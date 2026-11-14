import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { makePostDetail } from '~/mocks/handlers/post';
import { getItem } from '../getItem';

// 실제 Sentry를 불러오면 내부 setInterval이 남아 Jest가 종료되지 않는다
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getItem', () => {
  it('GET /post/:id 응답 data를 반환한다', async () => {
    await expect(getItem('99')).resolves.toEqual(makePostDetail({ id: 99 }));
  });

  it('images 배열이 비어있는 게시글도 정상 반환한다', async () => {
    server.use(http.get(`${BASE}/post/1`, () => HttpResponse.json(makePostDetail({ images: [] }))));

    const result = await getItem('1');

    expect(result.images).toEqual([]);
  });

  it('4xx 응답은 서버 메시지를 담은 AxiosError로 던진다', async () => {
    server.use(
      http.get(`${BASE}/post/999`, () =>
        HttpResponse.json({ message: '게시글을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    const error = await getItem('999').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).message).toBe('게시글을 찾을 수 없습니다');
    expect((error as AxiosError).response?.status).toBe(404);
  });

  it('5xx 응답은 서버 본문 대신 상태 코드만 알리는 AxiosError로 던진다', async () => {
    server.use(
      http.get(`${BASE}/post/1`, () =>
        HttpResponse.json({ message: 'FunctionCallException' }, { status: 500 })
      )
    );

    const error = await getItem('1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).message).toBe('요청이 실패했습니다. (500)');
    expect((error as AxiosError).response?.status).toBe(500);
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/post/1`, () => HttpResponse.error()));

    await expect(getItem('1')).rejects.toThrow();
  });

  it('postId가 양의 정수 문자열이 아니면 요청을 보내지 않고 실패한다', async () => {
    const requested = jest.fn();
    server.events.on('request:start', requested);

    try {
      await expect(getItem('1; DROP TABLE post;')).rejects.toThrow();
      await expect(getItem('NaN')).rejects.toThrow();
      await expect(getItem('-1')).rejects.toThrow();

      expect(requested).not.toHaveBeenCalled();
    } finally {
      server.events.removeListener('request:start', requested);
    }
  });
});
