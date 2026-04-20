import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { getAccessToken, getRefreshToken, clearAuthTokens } from '../auth';
import { setData } from '../setData';
import { instance, setQueryClientInstance } from '../axios';

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'http://test-api.com' } } },
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('../auth', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearAuthTokens: jest.fn(),
}));
jest.mock('../setData', () => ({
  setData: jest.fn(),
}));

const mockRouter = router as unknown as { replace: jest.Mock };
const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockGetRefreshToken = getRefreshToken as jest.MockedFunction<typeof getRefreshToken>;
const mockClearAuthTokens = clearAuthTokens as jest.MockedFunction<typeof clearAuthTokens>;
const mockSetData = setData as jest.MockedFunction<typeof setData>;
const mockSentry = Sentry as jest.Mocked<typeof Sentry>;

const BASE = 'http://test-api.com';
const server = setupServer();

beforeAll(() => {
  instance.defaults.baseURL = BASE;
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe('setQueryClientInstance', () => {
  it('QueryClient 인스턴스를 저장한다', () => {
    const client = new QueryClient();
    expect(() => setQueryClientInstance(client)).not.toThrow();
  });
});

describe('request interceptor', () => {
  it('accessToken이 있으면 Authorization 헤더를 설정한다', async () => {
    mockGetAccessToken.mockResolvedValue('my-access-token');

    let capturedHeader: string | null = null;
    server.use(
      http.get(`${BASE}/req-with-token`, ({ request }) => {
        capturedHeader = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      })
    );

    await instance.get('/req-with-token');

    expect(capturedHeader).toBe('Bearer my-access-token');
  });

  it('accessToken이 없으면 Sentry breadcrumb를 추가하고 요청은 성공한다', async () => {
    mockGetAccessToken.mockResolvedValue(null);

    server.use(http.get(`${BASE}/req-no-token`, () => HttpResponse.json({ ok: true })));

    await instance.get('/req-no-token');

    expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'auth', level: 'warning' })
    );
  });

  it('request 설정 중 에러가 발생하면 reject된다', async () => {
    mockGetAccessToken.mockRejectedValue(new Error('storage failure'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(instance.get('/req-error')).rejects.toThrow();
  });
});

describe('response interceptor', () => {
  it('401이 아닌 에러(500)는 그대로 reject된다', async () => {
    mockGetAccessToken.mockResolvedValue('token');

    server.use(http.get(`${BASE}/server-error`, () => new HttpResponse(null, { status: 500 })));

    await expect(instance.get('/server-error')).rejects.toThrow();
    expect(mockGetRefreshToken).not.toHaveBeenCalled();
  });

  it('/auth/signin 401은 토큰 갱신 시도 없이 reject된다', async () => {
    mockGetAccessToken.mockResolvedValue(null);

    server.use(http.post(`${BASE}/auth/signin`, () => new HttpResponse(null, { status: 401 })));

    await expect(instance.post('/auth/signin', {})).rejects.toThrow();
    expect(mockGetRefreshToken).not.toHaveBeenCalled();
  });

  it('/auth/reissue 자체가 401이면 재시도 없이 reject된다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh-token');
    mockClearAuthTokens.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    server.use(
      http.get(`${BASE}/auth-reissue-401`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => new HttpResponse(null, { status: 401 }))
    );

    await expect(instance.get('/auth-reissue-401')).rejects.toThrow();
  });

  it('refreshToken이 없으면 토큰을 초기화하고 로그인으로 이동한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue(null);
    mockClearAuthTokens.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const queryClient = new QueryClient();
    jest.spyOn(queryClient, 'clear');
    setQueryClientInstance(queryClient);

    server.use(http.get(`${BASE}/no-refresh-token`, () => new HttpResponse(null, { status: 401 })));

    await expect(instance.get('/no-refresh-token')).rejects.toThrow();

    expect(mockSentry.captureException).toHaveBeenCalled();
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/signin');
  });

  it('토큰 갱신 성공 시 원래 요청을 새 토큰으로 재시도한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('my-refresh-token');
    mockSetData.mockResolvedValue(undefined);
    mockClearAuthTokens.mockResolvedValue(undefined);

    let requestCount = 0;
    server.use(
      http.get(`${BASE}/retry-resource`, () => {
        requestCount++;
        if (requestCount === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ data: 'success' });
      }),
      http.post(`${BASE}/auth/reissue`, () => HttpResponse.json({ accessToken: 'brand-new-token' }))
    );

    const response = await instance.get('/retry-resource');

    expect(response.data).toEqual({ data: 'success' });
    expect(requestCount).toBe(2);
    expect(mockSetData).toHaveBeenCalledWith('accessToken', 'brand-new-token');
  });

  it('토큰 갱신 실패 시 Sentry 기록 + 토큰 초기화 + 로그인 이동', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('stale-refresh');
    mockClearAuthTokens.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const queryClient = new QueryClient();
    jest.spyOn(queryClient, 'clear');
    setQueryClientInstance(queryClient);

    server.use(
      http.get(`${BASE}/secured`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => new HttpResponse(null, { status: 500 }))
    );

    await expect(instance.get('/secured')).rejects.toThrow();

    expect(mockSentry.captureException).toHaveBeenCalled();
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/signin');
  });

  it('queryClientInstance가 null이어도 토큰 초기화 후 이동한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh');
    mockClearAuthTokens.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    setQueryClientInstance(null as unknown as QueryClient);

    server.use(
      http.get(`${BASE}/secured-no-qc`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => new HttpResponse(null, { status: 500 }))
    );

    await expect(instance.get('/secured-no-qc')).rejects.toThrow();

    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/signin');
  });

  it('router.replace 실패 시 console.warn을 호출하고 에러를 억제한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh');
    mockClearAuthTokens.mockResolvedValue(undefined);
    mockRouter.replace.mockImplementation(() => {
      throw new Error('Navigation failed');
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    server.use(
      http.get(`${BASE}/nav-fail`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => new HttpResponse(null, { status: 500 }))
    );

    await expect(instance.get('/nav-fail')).rejects.toThrow();

    expect(warnSpy).toHaveBeenCalledWith('Router navigation failed', expect.any(Error));
  });

  it('동시에 401이 발생해도 토큰 갱신은 한 번만 수행한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh-token');
    mockSetData.mockResolvedValue(undefined);
    mockClearAuthTokens.mockResolvedValue(undefined);

    let reissueCallCount = 0;
    const callCounts = { c1: 0, c2: 0 };

    server.use(
      http.get(`${BASE}/concurrent-a`, () => {
        callCounts.c1++;
        if (callCounts.c1 === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ endpoint: 'a' });
      }),
      http.get(`${BASE}/concurrent-b`, () => {
        callCounts.c2++;
        if (callCounts.c2 === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ endpoint: 'b' });
      }),
      http.post(`${BASE}/auth/reissue`, async () => {
        reissueCallCount++;
        await new Promise((r) => setTimeout(r, 30));
        return HttpResponse.json({ accessToken: 'concurrent-new-token' });
      })
    );

    const [res1, res2] = await Promise.all([
      instance.get('/concurrent-a'),
      instance.get('/concurrent-b'),
    ]);

    expect(reissueCallCount).toBe(1);
    expect(res1.data).toEqual({ endpoint: 'a' });
    expect(res2.data).toEqual({ endpoint: 'b' });
  });

  it('401 발생 후 refreshPromise가 null로 초기화된다 (finally 보장)', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh');
    mockSetData.mockResolvedValue(undefined);
    mockClearAuthTokens.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    let count = 0;
    server.use(
      http.get(`${BASE}/finally-check`, () => {
        count++;
        if (count === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${BASE}/auth/reissue`, () => HttpResponse.json({ accessToken: 'finally-token' }))
    );

    await instance.get('/finally-check');
    await instance.get('/finally-check');

    expect(count).toBe(3);
  });

  it('동시 401 발생 시 토큰 갱신 실패하면 두 번째 요청도 reject된다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh-token');
    mockClearAuthTokens.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const queryClient = new QueryClient();
    setQueryClientInstance(queryClient);

    server.use(
      http.get(`${BASE}/concurrent-fail-a`, () => new HttpResponse(null, { status: 401 })),
      http.get(`${BASE}/concurrent-fail-b`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, async () => {
        await new Promise((r) => setTimeout(r, 30));
        return new HttpResponse(null, { status: 500 });
      })
    );

    const [r1, r2] = await Promise.allSettled([
      instance.get('/concurrent-fail-a'),
      instance.get('/concurrent-fail-b'),
    ]);

    expect(r1.status).toBe('rejected');
    expect(r2.status).toBe('rejected');
  });
});
