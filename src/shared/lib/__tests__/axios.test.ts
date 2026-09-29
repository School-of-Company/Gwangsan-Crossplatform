import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { getAccessToken, getRefreshToken } from '../auth';
import { clearSession } from '../clearSession';
import Toast from 'react-native-toast-message';
import { setData } from '../setData';
import { instance, setQueryClientInstance, SessionExpiredError, TokenStorageError } from '../axios';

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
}));
jest.mock('../clearSession', () => ({
  clearSession: jest.fn(),
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));
jest.mock('../setData', () => ({
  setData: jest.fn(),
}));

const mockRouter = router as unknown as { replace: jest.Mock };
const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockGetRefreshToken = getRefreshToken as jest.MockedFunction<typeof getRefreshToken>;
const mockClearSession = clearSession as jest.MockedFunction<typeof clearSession>;
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

  it('request 인터셉터 체인 이전 단계에서 에러가 발생하면 그대로 reject한다', async () => {
    const handlers = (instance.interceptors.request as unknown as { handlers: any[] }).handlers;
    const rejectedHandler = handlers[0].rejected;
    const originalError = new Error('upstream config error');

    await expect(rejectedHandler(originalError)).rejects.toBe(originalError);
  });
});

describe('response interceptor', () => {
  it('401이 아닌 에러(500)는 그대로 reject된다', async () => {
    mockGetAccessToken.mockResolvedValue('token');

    server.use(http.get(`${BASE}/server-error`, () => new HttpResponse(null, { status: 500 })));

    await expect(instance.get('/server-error')).rejects.toThrow();
    expect(mockGetRefreshToken).not.toHaveBeenCalled();
  });

  it('__sentryStartTime이 없는 응답은 duration을 undefined로 기록한다', async () => {
    const handlers = (instance.interceptors.response as unknown as { handlers: any[] }).handlers;
    const fulfilledHandler = handlers[0].fulfilled;

    const fakeResponse = {
      status: 200,
      config: { method: 'get', url: '/no-start-time' },
    };

    const result = fulfilledHandler(fakeResponse);

    expect(result).toBe(fakeResponse);
    expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'http',
        data: expect.objectContaining({ duration_ms: undefined }),
      })
    );
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
    mockClearSession.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    server.use(
      http.get(`${BASE}/auth-reissue-401`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => new HttpResponse(null, { status: 401 }))
    );

    await expect(instance.get('/auth-reissue-401')).rejects.toThrow();
  });

  it('refreshToken이 없으면 Sentry 예외 없이(breadcrumb만 남기고) 토큰을 초기화하고 로그인으로 이동한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue(null);
    mockClearSession.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const queryClient = new QueryClient();
    jest.spyOn(queryClient, 'clear');
    setQueryClientInstance(queryClient);

    server.use(http.get(`${BASE}/no-refresh-token`, () => new HttpResponse(null, { status: 401 })));

    await expect(instance.get('/no-refresh-token')).rejects.toThrow();

    expect(mockSentry.captureException).not.toHaveBeenCalled();
    expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        level: 'info',
        message: expect.stringContaining('no refresh token'),
      })
    );
    expect(mockClearSession).toHaveBeenCalledWith(queryClient);
    expect(mockRouter.replace).toHaveBeenCalledWith('/signin/nickname');
  });

  it('토큰 갱신 성공 시 원래 요청을 새 토큰으로 재시도한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('my-refresh-token');
    mockSetData.mockResolvedValue(undefined);
    mockClearSession.mockResolvedValue(undefined);

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
    mockClearSession.mockResolvedValue(undefined);
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
    expect(mockClearSession).toHaveBeenCalledWith(queryClient);
    expect(mockRouter.replace).toHaveBeenCalledWith('/signin/nickname');
  });

  it('토큰 갱신 실패 원인이 Error가 아니면 String으로 변환해 Sentry에 기록한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh-token');
    mockSetData.mockRejectedValue('non-error-rejection-reason');
    mockClearSession.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    server.use(
      http.get(`${BASE}/secured-non-error`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => HttpResponse.json({ accessToken: 'new-token' }))
    );

    await expect(instance.get('/secured-non-error')).rejects.toBeInstanceOf(SessionExpiredError);

    expect(mockSentry.captureException).toHaveBeenCalledWith(
      'non-error-rejection-reason',
      expect.objectContaining({
        extra: expect.objectContaining({ errorMessage: 'non-error-rejection-reason' }),
      })
    );
  });

  describe('세션 안정화(#737)', () => {
    it('기기가 잠겨 refresh token을 읽지 못하면 로그아웃하지 않고 요청만 실패한다', async () => {
      mockGetAccessToken.mockResolvedValue('old-token');
      mockGetRefreshToken.mockRejectedValue(new Error('User interaction is not allowed.'));

      server.use(http.get(`${BASE}/locked-refresh`, () => new HttpResponse(null, { status: 401 })));

      await expect(instance.get('/locked-refresh')).rejects.toBeInstanceOf(TokenStorageError);

      expect(mockClearSession).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(mockSentry.captureException).not.toHaveBeenCalled();
    });

    it('401 처리 중 access token을 읽지 못해도 로그아웃하지 않는다', async () => {
      mockGetAccessToken
        .mockResolvedValueOnce('old-token')
        .mockRejectedValueOnce(new Error('User interaction is not allowed.'));

      server.use(http.get(`${BASE}/locked-access`, () => new HttpResponse(null, { status: 401 })));

      await expect(instance.get('/locked-access')).rejects.toBeInstanceOf(TokenStorageError);
      expect(mockClearSession).not.toHaveBeenCalled();
    });

    it('서버가 refresh token을 교체해 내려주면 함께 저장한다', async () => {
      mockGetAccessToken.mockResolvedValue('old-token');
      mockGetRefreshToken.mockResolvedValue('old-refresh');
      mockSetData.mockResolvedValue(undefined);

      let requestCount = 0;
      server.use(
        http.get(`${BASE}/rotate`, () => {
          requestCount++;
          return requestCount === 1
            ? new HttpResponse(null, { status: 401 })
            : HttpResponse.json({ ok: true });
        }),
        http.post(`${BASE}/auth/reissue`, () =>
          HttpResponse.json({ accessToken: 'new-access', refreshToken: 'new-refresh' })
        )
      );

      await instance.get('/rotate');

      expect(mockSetData).toHaveBeenCalledWith('accessToken', 'new-access');
      expect(mockSetData).toHaveBeenCalledWith('refreshToken', 'new-refresh');
    });

    it('다른 요청이 이미 재발급한 뒤 늦게 도착한 401은 재발급 없이 새 토큰으로 재시도한다', async () => {
      // 요청을 보낼 때는 예전 토큰, 401을 처리할 때는 이미 저장된 새 토큰
      mockGetAccessToken.mockResolvedValueOnce('old-token').mockResolvedValue('already-new');

      let reissueCount = 0;
      let retriedWith: string | null = null;
      server.use(
        http.get(`${BASE}/late-401`, ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer old-token') return new HttpResponse(null, { status: 401 });
          retriedWith = auth;
          return HttpResponse.json({ ok: true });
        }),
        http.post(`${BASE}/auth/reissue`, () => {
          reissueCount++;
          return HttpResponse.json({ accessToken: 'another' });
        })
      );

      await instance.get('/late-401');

      expect(reissueCount).toBe(0);
      expect(retriedWith).toBe('Bearer already-new');
    });

    it('재발급할 수 없으면 기다리던 요청까지 한국어 세션 만료 메시지로 실패한다', async () => {
      mockGetAccessToken.mockResolvedValue('old-token');
      mockGetRefreshToken.mockResolvedValue(null);
      mockClearSession.mockResolvedValue(undefined);
      setQueryClientInstance(new QueryClient());

      server.use(
        http.get(`${BASE}/expired-a`, () => new HttpResponse(null, { status: 401 })),
        http.get(`${BASE}/expired-b`, () => new HttpResponse(null, { status: 401 }))
      );

      const results = await Promise.allSettled([
        instance.get('/expired-a'),
        instance.get('/expired-b'),
      ]);

      results.forEach((result) => {
        expect(result.status).toBe('rejected');
        expect((result as PromiseRejectedResult).reason.message).toBe(
          '세션이 만료되었습니다. 다시 로그인해 주세요.'
        );
      });
      // 기다리던 요청이 여러 개여도 세션 정리와 안내는 한 번만 한다
      expect(mockClearSession).toHaveBeenCalledTimes(1);
      expect(Toast.show).toHaveBeenCalledTimes(1);
    });
  });

  it('queryClientInstance가 null이어도 토큰 초기화 후 이동한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh');
    mockClearSession.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    setQueryClientInstance(null as unknown as QueryClient);

    server.use(
      http.get(`${BASE}/secured-no-qc`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => new HttpResponse(null, { status: 500 }))
    );

    await expect(instance.get('/secured-no-qc')).rejects.toThrow();

    expect(mockClearSession).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/signin/nickname');
  });

  it('router.replace 실패 시 console.warn을 호출하고 에러를 억제한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh');
    mockClearSession.mockResolvedValue(undefined);
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
    mockClearSession.mockResolvedValue(undefined);

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
    mockClearSession.mockResolvedValue(undefined);
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

  it('/auth/reissue가 타임아웃/네트워크 오류로 응답 없이 실패하면 세션을 유지한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('valid-refresh-token');
    mockClearSession.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const queryClient = new QueryClient();
    jest.spyOn(queryClient, 'clear');
    setQueryClientInstance(queryClient);

    server.use(
      http.get(`${BASE}/reissue-timeout`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () => HttpResponse.error())
    );

    await expect(instance.get('/reissue-timeout')).rejects.toThrow();

    // 기기/네트워크 상태에 의한 실패(오프라인, 타임아웃 등)는 앱 버그가 아니므로
    // Sentry 예외로 남기지 않고 breadcrumb만 남긴다.
    expect(mockSentry.captureException).not.toHaveBeenCalled();
    expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Token refresh skipped: network or timeout error',
      })
    );
    expect(mockClearSession).not.toHaveBeenCalled();
    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/signin/nickname');
  });

  it('토큰 갱신 후 재시도 요청이 다시 401이면 로그인으로 이동한다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh-token');
    mockSetData.mockResolvedValue(undefined);
    mockClearSession.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const queryClient = new QueryClient();
    jest.spyOn(queryClient, 'clear');
    setQueryClientInstance(queryClient);

    server.use(
      http.get(`${BASE}/still-unauthorized`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/reissue`, () =>
        HttpResponse.json({ accessToken: 'new-but-invalid-token' })
      )
    );

    await expect(instance.get('/still-unauthorized')).rejects.toThrow();

    expect(mockClearSession).toHaveBeenCalledWith(queryClient);
    expect(mockRouter.replace).toHaveBeenCalledWith('/signin/nickname');
  });

  it('동시 401 발생 시 토큰 갱신 실패하면 두 번째 요청도 reject된다', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('refresh-token');
    mockClearSession.mockResolvedValue(undefined);
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
