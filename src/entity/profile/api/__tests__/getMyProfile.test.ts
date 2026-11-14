import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getMyProfile } from '../getMyProfile';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getMyProfile', () => {
  it('GET /member 응답 data를 반환한다', async () => {
    const profile = { memberId: 1, nickname: '광산인' };
    server.use(http.get(`${BASE}/member`, () => HttpResponse.json(profile)));

    await expect(getMyProfile()).resolves.toEqual(profile);
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/member`, () =>
        HttpResponse.json({ message: '접근 권한이 없습니다' }, { status: 403 })
      )
    );

    await expect(getMyProfile()).rejects.toThrow('접근 권한이 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/member`, () => HttpResponse.error()));

    await expect(getMyProfile()).rejects.toThrow();
  });
});
