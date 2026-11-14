import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { withdrawal } from '../withdrawal';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('withdrawal', () => {
  it('DELETE /member 성공 시 응답을 반환한다', async () => {
    server.use(http.delete(`${BASE}/member`, () => HttpResponse.json({ message: 'success' })));

    await expect(withdrawal()).resolves.toEqual({ message: 'success' });
  });

  it('서버 에러 시 서버 메시지로 에러를 throw한다', async () => {
    server.use(
      http.delete(`${BASE}/member`, () =>
        HttpResponse.json({ message: '탈퇴 처리 중 오류가 발생했습니다' }, { status: 403 })
      )
    );

    await expect(withdrawal()).rejects.toThrow('탈퇴 처리 중 오류가 발생했습니다');
  });

  it('5xx는 상태 코드 기반 에러 메시지를 throw한다', async () => {
    server.use(http.delete(`${BASE}/member`, () => HttpResponse.json({}, { status: 500 })));

    await expect(withdrawal()).rejects.toThrow('요청이 실패했습니다. (500)');
  });

  it('네트워크 오류는 에러를 throw한다', async () => {
    server.use(http.delete(`${BASE}/member`, () => HttpResponse.error()));

    await expect(withdrawal()).rejects.toThrow();
  });
});
