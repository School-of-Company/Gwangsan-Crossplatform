import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { findNickname } from '../findNickname';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('findNickname', () => {
  it('/auth/nickname으로 phoneNumber를 보내고 nickname을 반환한다', async () => {
    const received = jest.fn();
    server.use(
      http.post(`${BASE}/auth/nickname`, async ({ request }) => {
        received(await request.json());
        return HttpResponse.json({ nickname: '홍길동' });
      })
    );

    await expect(findNickname('01099998888')).resolves.toBe('홍길동');
    expect(received).toHaveBeenCalledWith({ phoneNumber: '01099998888' });
  });

  it('서버 에러 시 서버 메시지로 에러를 throw한다', async () => {
    server.use(
      http.post(`${BASE}/auth/nickname`, () =>
        HttpResponse.json({ message: '일치하는 회원이 없습니다' }, { status: 404 })
      )
    );

    await expect(findNickname('01012345678')).rejects.toThrow('일치하는 회원이 없습니다');
  });

  it('5xx는 상태 코드 기반 에러 메시지를 throw한다', async () => {
    server.use(http.post(`${BASE}/auth/nickname`, () => HttpResponse.json({}, { status: 500 })));

    await expect(findNickname('01012345678')).rejects.toThrow('요청이 실패했습니다. (500)');
  });

  it('네트워크 오류는 에러를 throw한다', async () => {
    server.use(http.post(`${BASE}/auth/nickname`, () => HttpResponse.error()));

    await expect(findNickname('01012345678')).rejects.toThrow();
  });
});
