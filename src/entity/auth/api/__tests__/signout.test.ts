import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { clearAuthTokens } from '~/shared/lib/auth';
import { server } from '~/mocks/server';
import { signout } from '../signout';

// 요청 인터셉터가 getAccessToken을 쓰므로 토큰 삭제만 mock으로 바꾼다
jest.mock('~/shared/lib/auth', () => ({
  ...jest.requireActual('~/shared/lib/auth'),
  clearAuthTokens: jest.fn(),
}));

const mockClearAuthTokens = clearAuthTokens as jest.MockedFunction<typeof clearAuthTokens>;

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

beforeEach(() => {
  mockClearAuthTokens.mockReset();
  mockClearAuthTokens.mockResolvedValue(undefined);
});

describe('signout', () => {
  it('DELETE /auth/signout 성공 시 응답 메시지를 반환하고 토큰을 초기화한다', async () => {
    server.use(
      http.delete(`${BASE}/auth/signout`, () => HttpResponse.json({ message: 'success' }))
    );

    await expect(signout()).resolves.toEqual({ message: 'success' });
    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });

  it('서버 에러 응답이어도 토큰을 초기화하고 서버 메시지로 에러를 throw한다', async () => {
    server.use(
      http.delete(`${BASE}/auth/signout`, () =>
        HttpResponse.json({ message: '이미 로그아웃된 상태입니다' }, { status: 403 })
      )
    );

    await expect(signout()).rejects.toThrow('이미 로그아웃된 상태입니다');
    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });

  it('네트워크 오류여도 토큰을 초기화하고 에러를 throw한다', async () => {
    server.use(http.delete(`${BASE}/auth/signout`, () => HttpResponse.error()));

    await expect(signout()).rejects.toThrow();
    expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
  });
});
