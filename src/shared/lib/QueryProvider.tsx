import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { AxiosError } from 'axios';
import { setQueryClientInstance } from './axios';
import * as Sentry from '@sentry/react-native';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
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
      throwOnError: (error) => {
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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {Platform.OS === 'web' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
