import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getMyPosts } from '../getMyPosts';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getMyPosts', () => {
  it('GET /post/current 응답 data를 반환한다', async () => {
    server.use(
      http.get(`${BASE}/post/current`, () => HttpResponse.json([{ id: 1, title: '내 게시글' }]))
    );

    await expect(getMyPosts()).resolves.toEqual([{ id: 1, title: '내 게시글' }]);
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/post/current`, () =>
        HttpResponse.json({ message: '접근 권한이 없습니다' }, { status: 403 })
      )
    );

    await expect(getMyPosts()).rejects.toThrow('접근 권한이 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/post/current`, () => HttpResponse.error()));

    await expect(getMyPosts()).rejects.toThrow();
  });
});
