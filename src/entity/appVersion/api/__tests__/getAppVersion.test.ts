import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { instance } from '~/shared/lib/axios';
import { shouldRetryQuery, shouldThrowQueryError } from '~/shared/lib/QueryProvider';
import { appVersionHandlers, makeAppVersion } from '~/mocks/handlers/appVersion';
import { getAppVersion } from '../getAppVersion';

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'http://test-api.com' } } },
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('~/shared/lib/auth', () => ({
  getAccessToken: jest.fn(() => Promise.resolve(null)),
  getRefreshToken: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('~/shared/lib/biometricCredentials', () => ({
  syncBiometricCredentials: jest.fn(() => Promise.resolve()),
}));
jest.mock('~/shared/lib/clearSession', () => ({ clearSession: jest.fn() }));
jest.mock('~/shared/lib/setData', () => ({ setData: jest.fn() }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const BASE = 'http://test-api.com';
const server = setupServer(...appVersionHandlers);

beforeAll(() => {
  instance.defaults.baseURL = BASE;
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getAppVersion', () => {
  it('GET /app/version에 platform 쿼리를 붙여 버전 정보를 받아온다', async () => {
    await expect(getAppVersion('ios')).resolves.toEqual(makeAppVersion({ latestVersion: '1.3.0' }));
    await expect(getAppVersion('android')).resolves.toEqual(
      makeAppVersion({ latestVersion: '1.2.9' })
    );
  });

  it('platform을 생략하면 현재 기기 OS로 요청한다', async () => {
    let requestedPlatform: string | null = null;
    server.use(
      http.get(`${BASE}/app/version`, ({ request }) => {
        requestedPlatform = new URL(request.url).searchParams.get('platform');
        return HttpResponse.json(makeAppVersion());
      })
    );

    await getAppVersion();

    // jest-expo 기본 프리셋의 Platform.OS는 ios다.
    expect(requestedPlatform).toBe('ios');
  });

  it('서버 오류면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/app/version`, () =>
        HttpResponse.json({ message: '버전 정보를 찾을 수 없습니다.' }, { status: 404 })
      )
    );

    await expect(getAppVersion('ios')).rejects.toThrow('버전 정보를 찾을 수 없습니다.');
  });

  it('4xx는 상태 코드를 유지한 채 던져 재시도하지 않고 ErrorBoundary로 보내지 않는다', async () => {
    server.use(
      http.get(`${BASE}/app/version`, () =>
        HttpResponse.json({ message: '지원하지 않는 플랫폼입니다.' }, { status: 400 })
      )
    );

    const error = await getAppVersion('ios').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(400);
    expect(shouldRetryQuery(0, error)).toBe(false);
    expect(shouldThrowQueryError(error, false)).toBe(false);
  });

  it('5xx는 캐시가 없으면 ErrorBoundary로 보낸다', async () => {
    server.use(http.get(`${BASE}/app/version`, () => new HttpResponse(null, { status: 500 })));

    const error = await getAppVersion('ios').catch((e: unknown) => e);

    expect((error as AxiosError).response?.status).toBe(500);
    expect(shouldThrowQueryError(error, false)).toBe(true);
  });
});
