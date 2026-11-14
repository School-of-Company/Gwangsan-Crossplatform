import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getProfile } from '../getProfile';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('getProfile', () => {
  it('GET /member/:id 응답 data를 반환한다', async () => {
    server.use(
      http.get(`${BASE}/member/42`, () => HttpResponse.json({ memberId: 42, nickname: '상대방' }))
    );

    await expect(getProfile('42')).resolves.toEqual({ memberId: 42, nickname: '상대방' });
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/member/42`, () =>
        HttpResponse.json({ message: '회원을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    await expect(getProfile('42')).rejects.toThrow('회원을 찾을 수 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/member/42`, () => HttpResponse.error()));

    await expect(getProfile('42')).rejects.toThrow();
  });
});
