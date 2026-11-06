import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { instance } from '~/shared/lib/axios';
import { shouldThrowQueryError } from '~/shared/lib/QueryProvider';
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

  // 앱 전역 QueryClient는 캐시 없는 5xx를 ErrorBoundary로 보낸다. 버전 확인은 루트 레이아웃에서
  // 돌기 때문에 여기서 던지면 앱 전체가 오류 화면이 되므로, 실패해도 던지지 않아야 한다.
  it('앱 전역 throwOnError 정책에서도 5xx를 ErrorBoundary로 던지지 않는다', async () => {
    server.use(http.get(`${BASE}/app/version`, () => new HttpResponse(null, { status: 503 })));
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          throwOnError: (error, query) =>
            shouldThrowQueryError(error, query.state.data !== undefined),
        },
      },
    });
    const caught: unknown[] = [];
    class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
      state = { failed: false };
      static getDerivedStateFromError() {
        return { failed: true };
      }
      componentDidCatch(error: unknown) {
        caught.push(error);
      }
      render() {
        return this.state.failed ? null : this.props.children;
      }
    }
    let status = '';
    const Probe = () => {
      status = useAppVersion().status;
      return null;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Boundary>
          <Probe />
        </Boundary>
      </QueryClientProvider>
    );

    await waitFor(() => expect(status === 'error' || caught.length > 0).toBe(true));
    expect(caught).toHaveLength(0);
    expect(status).toBe('error');
  });
});
