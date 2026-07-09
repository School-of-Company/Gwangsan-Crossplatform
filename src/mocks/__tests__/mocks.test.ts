import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { server } from '../server';
import { authHandlers } from '../handlers/auth';
import { postHandlers, makePostListItem, makePostDetail } from '../handlers/post';
import { API_URL } from '../env';

const BASE = 'http://test-api.com';
const client = axios.create({ baseURL: BASE });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('env', () => {
  it('API_URL은 테스트용 베이스 URL을 노출한다', () => {
    expect(API_URL).toBe(BASE);
  });
});

describe('authHandlers', () => {
  it('POST /auth/signin은 토큰 응답을 반환한다', async () => {
    const { data } = await client.post('/auth/signin');

    expect(data).toEqual({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      accessTokenExpiresIn: '3600',
      refreshTokenExpiresIn: '86400',
    });
  });

  it('POST /auth/signup은 성공 메시지를 반환한다', async () => {
    const { data } = await client.post('/auth/signup');

    expect(data).toEqual({ message: 'success' });
  });

  it('DELETE /auth/signout은 성공 메시지를 반환한다', async () => {
    const { data } = await client.delete('/auth/signout');

    expect(data).toEqual({ message: 'success' });
  });

  it('DELETE /member는 성공 메시지를 반환한다', async () => {
    const { data } = await client.delete('/member');

    expect(data).toEqual({ message: 'success' });
  });

  it('POST /auth/reissue는 새 accessToken을 반환한다', async () => {
    const { data } = await client.post('/auth/reissue');

    expect(data).toEqual({ accessToken: 'new-access-token' });
  });

  it('GET /member는 memberId를 반환한다', async () => {
    const { data } = await client.get('/member');

    expect(data).toEqual({ memberId: 123 });
  });

  it('PATCH /auth/password는 성공 메시지를 반환한다', async () => {
    const { data } = await client.patch('/auth/password');

    expect(data).toEqual({ message: 'success' });
  });

  it.each(['/sms', '/sms/verify', '/sms/password', '/sms/password/verify'])(
    'POST %s는 성공 메시지를 반환한다',
    async (path) => {
      const { data } = await client.post(path);

      expect(data).toEqual({ message: 'success' });
    }
  );

  it('authHandlers 배열은 server의 기본 핸들러로 등록되어 있다', () => {
    expect(authHandlers.length).toBeGreaterThan(0);
  });
});

describe('postHandlers', () => {
  beforeEach(() => {
    server.use(...postHandlers);
  });

  it('GET /post는 게시글 목록을 반환한다', async () => {
    const { data } = await client.get('/post');

    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual([makePostListItem()]);
  });

  it('GET /post/:postId는 요청한 id로 상세 게시글을 반환한다', async () => {
    const { data } = await client.get('/post/42');

    expect(data).toEqual(makePostDetail({ id: 42 }));
  });
});

describe('makePostListItem', () => {
  it('기본값으로 게시글 목록 아이템을 생성한다', () => {
    const item = makePostListItem();

    expect(item).toMatchObject({
      id: 1,
      title: '테스트 게시글',
      type: 'OBJECT',
      mode: 'GIVER',
      isCompletable: true,
      isCompleted: false,
    });
  });

  it('overrides로 필드를 덮어쓸 수 있다', () => {
    const item = makePostListItem({ id: 99, title: '커스텀 제목' });

    expect(item.id).toBe(99);
    expect(item.title).toBe('커스텀 제목');
  });
});

describe('makePostDetail', () => {
  it('기본값으로 게시글 상세를 생성하며 member 정보를 포함한다', () => {
    const detail = makePostDetail();

    expect(detail.member).toEqual({
      memberId: 42,
      nickname: '홍길동',
      placeName: '광산구',
      light: 80,
    });
  });

  it('overrides로 필드를 덮어쓸 수 있다', () => {
    const detail = makePostDetail({ id: 7, isCompleted: true });

    expect(detail.id).toBe(7);
    expect(detail.isCompleted).toBe(true);
  });
});

describe('HttpResponse 헬퍼 사용 확인', () => {
  it('임의의 핸들러를 server.use로 추가해 응답을 검증할 수 있다', async () => {
    server.use(http.get(`${BASE}/ping`, () => HttpResponse.json({ ok: true })));

    const { data } = await client.get('/ping');

    expect(data).toEqual({ ok: true });
  });
});
