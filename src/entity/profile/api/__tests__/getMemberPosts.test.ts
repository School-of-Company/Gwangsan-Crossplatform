import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getMemberPosts } from '../getMemberPosts';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getMemberPosts', () => {
  it('GET /post/member/:id 응답 data를 반환한다', async () => {
    server.use(
      http.get(`${BASE}/post/member/5`, () =>
        HttpResponse.json([{ id: 2, title: '상대방 게시글' }])
      )
    );

    await expect(getMemberPosts('5')).resolves.toEqual([{ id: 2, title: '상대방 게시글' }]);
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/post/member/5`, () =>
        HttpResponse.json({ message: '회원을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    await expect(getMemberPosts('5')).rejects.toThrow('회원을 찾을 수 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/post/member/5`, () => HttpResponse.error()));

    await expect(getMemberPosts('5')).rejects.toThrow();
  });
});
