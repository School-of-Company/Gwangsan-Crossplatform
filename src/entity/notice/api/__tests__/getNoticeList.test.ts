import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getNoticeList } from '../getNoticeList';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getNoticeList', () => {
  it('GET /notice 호출 후 이미지가 포함된 목록을 반환한다', async () => {
    const list = [
      {
        id: 1,
        title: '이미지 공지',
        content: '내용',
        images: [{ imageId: 1, imageUrl: 'https://example.com/img.png' }],
      },
      { id: 2, title: '공지2', content: '내용2', images: [] },
    ];
    server.use(http.get(`${BASE}/notice`, () => HttpResponse.json(list)));

    await expect(getNoticeList()).resolves.toEqual(list);
  });

  it('빈 배열을 반환할 수 있다', async () => {
    server.use(http.get(`${BASE}/notice`, () => HttpResponse.json([])));

    await expect(getNoticeList()).resolves.toEqual([]);
  });

  it('5xx는 상태 코드만 알리는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/notice`, () => new HttpResponse(null, { status: 500 })));

    const error = await getNoticeList().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(500);
    expect((error as Error).message).toBe('요청이 실패했습니다. (500)');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/notice`, () => HttpResponse.error()));

    await expect(getNoticeList()).rejects.toThrow();
  });
});
