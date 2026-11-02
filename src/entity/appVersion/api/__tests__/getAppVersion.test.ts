import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { instance } from '~/shared/lib/axios';
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
});
