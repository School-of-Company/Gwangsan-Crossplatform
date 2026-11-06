import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { Text, AppState, AppStateStatus } from 'react-native';
import { AxiosError } from 'axios';
import QueryProvider, { shouldRetryQuery, shouldThrowQueryError } from '../QueryProvider';
import { toAppError } from '../errorHandler';
import { SessionExpiredError, setQueryClientInstance, TokenStorageError } from '../axios';
import * as Sentry from '@sentry/react-native';

jest.mock('../axios', () => {
  class SessionExpiredError extends Error {}
  class TokenStorageError extends Error {}
  return { setQueryClientInstance: jest.fn(), SessionExpiredError, TokenStorageError };
});
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()) },
}));
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const mockSetQueryClientInstance = setQueryClientInstance as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;

function ClientProbe() {
  const client = useQueryClient();
  return <Text testID="probe">{client ? 'has-client' : 'no-client'}</Text>;
}

// QueryProvider가 마운트되며 setQueryClientInstance로 넘긴 클라이언트를 그대로 가져다 쓴다.
const captureClient = (): QueryClient => {
  render(
    <QueryProvider>
      <Text>capture</Text>
    </QueryProvider>
  );
  return mockSetQueryClientInstance.mock.calls[0][0] as QueryClient;
};

const makeAxiosError = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', { headers: {} } as any, null, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: { headers: {} } as any,
  });

const callThrowOnError = (error: unknown, data: unknown) => {
  const throwOnError = captureClient().getDefaultOptions().queries?.throwOnError as (
    error: unknown,
    query: unknown
  ) => boolean;
  return throwOnError(error, { state: { data } });
};

let appStateListener: ((state: AppStateStatus) => void) | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    appStateListener = handler;
    return { remove: jest.fn() } as never;
  });
  (AppState as { currentState: string }).currentState = 'active';
});

afterEach(() => {
  jest.restoreAllMocks();
  focusManager.setFocused(true);
});

describe('QueryProvider', () => {
  it('provides a working QueryClient to descendants', () => {
    const { getByTestId } = render(
      <QueryProvider>
        <ClientProbe />
      </QueryProvider>
    );

    expect(getByTestId('probe').props.children).toBe('has-client');
  });

  it('renders its children unchanged', () => {
    const { getByText } = render(
      <QueryProvider>
        <Text>hello-child</Text>
      </QueryProvider>
    );

    expect(getByText('hello-child')).toBeTruthy();
  });

  it('registers the QueryClient instance with the axios module on mount', () => {
    render(
      <QueryProvider>
        <Text>child</Text>
      </QueryProvider>
    );

    expect(mockSetQueryClientInstance).toHaveBeenCalledTimes(1);
    expect(mockSetQueryClientInstance).toHaveBeenCalledWith(expect.anything());
  });

  describe('throwOnError', () => {
    it('캐시된 데이터가 없는 5xx는 ErrorBoundary로 던진다', () => {
      expect(callThrowOnError(makeAxiosError(500), undefined)).toBe(true);
    });

    it('캐시된 데이터가 있으면 5xx여도 던지지 않는다', () => {
      expect(callThrowOnError(makeAxiosError(500), [])).toBe(false);
    });

    it('4xx는 던지지 않는다', () => {
      expect(callThrowOnError(makeAxiosError(404), undefined)).toBe(false);
    });

    it('AxiosError가 아니면 던지지 않는다', () => {
      expect(callThrowOnError(new Error('boom'), undefined)).toBe(false);
    });

    it('toAppError로 메시지가 바뀐 AxiosError도 상태 코드로 판단한다', () => {
      const error = toAppError(makeAxiosError(502));

      expect(shouldThrowQueryError(error, false)).toBe(true);
      expect(shouldThrowQueryError(error, true)).toBe(false);
      expect(shouldThrowQueryError(toAppError(makeAxiosError(403)), false)).toBe(false);
    });
  });

  describe('AppState 연동', () => {
    it('앱이 백그라운드로 가면 focusManager를 unfocused로 만들어 폴링을 멈춘다', () => {
      const setFocused = jest.spyOn(focusManager, 'setFocused');

      render(
        <QueryProvider>
          <Text>child</Text>
        </QueryProvider>
      );

      appStateListener?.('background');
      expect(setFocused).toHaveBeenLastCalledWith(false);

      appStateListener?.('active');
      expect(setFocused).toHaveBeenLastCalledWith(true);
    });
  });

  it('reports query failures to Sentry', async () => {
    function FailingQuery() {
      const { isError } = useQuery({
        queryKey: ['boom'],
        queryFn: () => Promise.reject(new Error('query failed')),
        retry: false,
      });
      return <Text>{isError ? 'errored' : 'loading'}</Text>;
    }

    const { getByText } = render(
      <QueryProvider>
        <FailingQuery />
      </QueryProvider>
    );

    await waitFor(() => expect(getByText('errored')).toBeTruthy());
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ context: 'react_query_error' }),
      })
    );
  });

  it('reports mutation failures to Sentry', async () => {
    function FailingMutation() {
      const { mutate, isError } = useMutation({
        mutationFn: () => Promise.reject(new Error('mutation failed')),
      });
      return (
        <>
          <Text onPress={() => mutate()}>trigger</Text>
          <Text>{isError ? 'errored' : 'idle'}</Text>
        </>
      );
    }

    const { getByText } = render(
      <QueryProvider>
        <FailingMutation />
      </QueryProvider>
    );

    getByText('trigger').props.onPress();

    await waitFor(() => expect(getByText('errored')).toBeTruthy());
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ context: 'react_mutation_error' }),
      })
    );
  });

  // 기기 오프라인/타임아웃 등 응답이 없는 네트워크 실패는 앱 버그가 아니므로
  // Sentry 예외로 남기지 않고 breadcrumb만 남긴다 (see #560).
  it('does not report network/timeout query failures to Sentry', async () => {
    const networkError = new AxiosError('Network Error', 'ERR_NETWORK', {} as any, null, undefined);

    function FailingQuery() {
      const { isError } = useQuery({
        queryKey: ['network-boom'],
        queryFn: () => Promise.reject(networkError),
        retry: false,
      });
      return <Text>{isError ? 'errored' : 'loading'}</Text>;
    }

    const { getByText } = render(
      <QueryProvider>
        <FailingQuery />
      </QueryProvider>
    );

    await waitFor(() => expect(getByText('errored')).toBeTruthy());
    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'react-query' })
    );
  });

  it('does not report network/timeout mutation failures to Sentry', async () => {
    const networkError = new AxiosError('Network Error', 'ERR_NETWORK', {} as any, null, undefined);

    function FailingMutation() {
      const { mutate, isError } = useMutation({
        mutationFn: () => Promise.reject(networkError),
      });
      return (
        <>
          <Text onPress={() => mutate()}>trigger</Text>
          <Text>{isError ? 'errored' : 'idle'}</Text>
        </>
      );
    }

    const { getByText } = render(
      <QueryProvider>
        <FailingMutation />
      </QueryProvider>
    );

    getByText('trigger').props.onPress();

    await waitFor(() => expect(getByText('errored')).toBeTruthy());
    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'react-query' })
    );
  });

  describe('shouldRetryQuery(#739)', () => {
    it.each([400, 401, 403, 404, 409])('%i 응답은 재시도하지 않는다', (status) => {
      expect(shouldRetryQuery(0, makeAxiosError(status))).toBe(false);
    });

    it.each([500, 502, 503])('%i 응답은 한 번 재시도한다', (status) => {
      expect(shouldRetryQuery(0, makeAxiosError(status))).toBe(true);
      expect(shouldRetryQuery(1, makeAxiosError(status))).toBe(false);
    });

    it('응답이 없는 네트워크 오류는 한 번 재시도한다', () => {
      expect(shouldRetryQuery(0, new Error('Network Error'))).toBe(true);
    });

    it('세션 만료·토큰 읽기 실패는 status가 없어도 재시도하지 않는다', () => {
      expect(shouldRetryQuery(0, new SessionExpiredError())).toBe(false);
      expect(shouldRetryQuery(0, new TokenStorageError(new Error('locked')))).toBe(false);
    });
  });

  describe('onlineManager', () => {
    const mockAddEventListener = NetInfo.addEventListener as jest.Mock;

    afterEach(() => {
      onlineManager.setOnline(true);
    });

    const renderAndGetNetInfoListener = () => {
      render(
        <QueryProvider>
          <Text>online</Text>
        </QueryProvider>
      );
      const calls = mockAddEventListener.mock.calls;
      return calls[calls.length - 1][0] as (state: { isConnected: boolean | null }) => void;
    };

    it('NetInfo 연결 상태를 onlineManager에 연결한다', () => {
      const listener = renderAndGetNetInfoListener();

      listener({ isConnected: false });
      expect(onlineManager.isOnline()).toBe(false);

      listener({ isConnected: true });
      expect(onlineManager.isOnline()).toBe(true);
    });

    it('연결 상태를 아직 모르면(null) 온라인으로 본다', () => {
      const listener = renderAndGetNetInfoListener();

      listener({ isConnected: false });
      listener({ isConnected: null });

      expect(onlineManager.isOnline()).toBe(true);
    });
  });

  describe('ReactQueryDevtools', () => {
    // 모듈 최상단에서 플랫폼을 판별하므로, 플랫폼을 바꾼 격리 레지스트리에서 React·RNTL까지 새로 불러와 렌더링한다.
    // 격리된 RNTL은 테스트 안에서 정리 훅을 등록할 수 없어 pure 엔트리를 쓰고 직접 unmount한다.
    let devtoolsLoaded = false;

    const renderHostTypes = (os: string): string[] => {
      let types: string[] = [];
      jest.isolateModules(() => {
        require('react-native').Platform.OS = os;
        const IsolatedReact = require('react');
        jest.doMock('@tanstack/react-query-devtools', () => {
          devtoolsLoaded = true;
          return { ReactQueryDevtools: () => IsolatedReact.createElement('devtools-mock') };
        });
        const { render: isolatedRender } = require('@testing-library/react-native/pure');
        const IsolatedProvider = require('../QueryProvider').default;
        const rendered = isolatedRender(
          IsolatedReact.createElement(IsolatedProvider, null, IsolatedReact.createElement('child'))
        );
        const json = rendered.toJSON();
        types = ((Array.isArray(json) ? json : [json]) as { type: string }[]).map((n) => n.type);
        rendered.unmount();
      });
      return types;
    };

    afterEach(() => {
      devtoolsLoaded = false;
      jest.dontMock('@tanstack/react-query-devtools');
    });

    it('웹 개발 환경에서는 devtools를 불러와 렌더링한다', () => {
      expect(renderHostTypes('web')).toEqual(['child', 'devtools-mock']);
      expect(devtoolsLoaded).toBe(true);
    });

    it('네이티브에서는 devtools 모듈을 불러오지도 렌더링하지도 않는다', () => {
      expect(renderHostTypes('ios')).toEqual(['child']);
      expect(devtoolsLoaded).toBe(false);
    });
  });
});
