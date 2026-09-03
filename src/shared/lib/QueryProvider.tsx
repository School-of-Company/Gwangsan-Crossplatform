import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  focusManager,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { AxiosError } from 'axios';
import { setQueryClientInstance } from './axios';
import { isNetworkOrTimeoutError } from './errorHandler';
import * as Sentry from '@sentry/react-native';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 기기 오프라인, 5s 타임아웃 등 실사용자 네트워크 상태에 의한 실패는 앱 버그가
      // 아니므로 Sentry 예외로 남기지 않고 breadcrumb만 남겨 노이즈를 줄인다.
      if (isNetworkOrTimeoutError(error)) {
        Sentry.addBreadcrumb({
          category: 'react-query',
          message: `Query failed with network/timeout error: ${JSON.stringify(query.queryKey)}`,
          level: 'warning',
        });
        return;
      }

      Sentry.captureException(error, {
        extra: {
          queryKey: JSON.stringify(query.queryKey),
          context: 'react_query_error',
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (isNetworkOrTimeoutError(error)) {
        Sentry.addBreadcrumb({
          category: 'react-query',
          message: `Mutation failed with network/timeout error: ${JSON.stringify(mutation.options.mutationKey)}`,
          level: 'warning',
        });
        return;
      }

      Sentry.captureException(error, {
        extra: {
          mutationKey: JSON.stringify(mutation.options.mutationKey),
          context: 'react_mutation_error',
        },
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      // 이미 받아둔 데이터가 있으면 백그라운드 refetch가 5xx로 실패해도
      // 화면 전체를 ErrorBoundary로 날리지 않고 기존 데이터를 유지한다.
      throwOnError: (error, query) => {
        if (query.state.data !== undefined) return false;
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          return status !== undefined && status >= 500;
        }
        return false;
      },
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  useEffect(() => {
    setQueryClientInstance(queryClient);
  }, []);

  // RN에는 window focus 이벤트가 없어 focusManager가 항상 focused로 남는다.
  // 그러면 refetchInterval이 백그라운드/화면 잠금 상태에서도 계속 돌고,
  // 이때 잠긴 키체인에서 토큰을 읽다 SecureStore가 FunctionCallException으로 실패한다.
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {Platform.OS === 'web' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
