import { waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { instance } from '~/shared/lib/axios';
import { renderHookWithProviders } from '~/test-utils';
import { appVersionHandlers, makeAppVersion } from '~/mocks/handlers/appVersion';
import { useAppVersion } from '../useAppVersion';

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

describe('useAppVersion', () => {
  it('현재 OS의 최신 버전 정보를 ["appVersion", OS] 키로 캐시한다', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useAppVersion());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(makeAppVersion({ latestVersion: '1.3.0' }));
    expect(queryClient.getQueryData(['appVersion', 'ios'])).toEqual(result.current.data);
  });

  it('실패해도 재시도하지 않고 에러 상태로 끝난다', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/app/version`, () => {
        calls += 1;
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHookWithProviders(() => useAppVersion());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('500');
    expect(calls).toBe(1);
  });
});
