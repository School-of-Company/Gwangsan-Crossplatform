import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useQuery, useQueryClient, QueryClient, focusManager } from '@tanstack/react-query';
import { Text, AppState, AppStateStatus } from 'react-native';
import { AxiosError } from 'axios';
import QueryProvider from '../QueryProvider';
import { setQueryClientInstance } from '../axios';
import * as Sentry from '@sentry/react-native';

jest.mock('../axios', () => ({ setQueryClientInstance: jest.fn() }));
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));

const mockSetQueryClientInstance = setQueryClientInstance as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;

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
});
