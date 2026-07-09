import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

beforeEach(() => {
  jest.clearAllMocks();
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
