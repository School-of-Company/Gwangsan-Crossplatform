import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from 'react-native';
import { createQueryClient, createQueryWrapper } from '../createQueryWrapper';

describe('createQueryClient', () => {
  it('retry가 비활성화된 QueryClient를 생성한다', () => {
    const client = createQueryClient();

    expect(client.getDefaultOptions().queries?.retry).toBe(false);
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  });
});

describe('createQueryWrapper', () => {
  const Probe = () => {
    const queryClient = useQueryClient();
    const { data } = useQuery({ queryKey: ['probe'], queryFn: () => Promise.resolve('ok') });
    return <Text>{data ?? (queryClient ? 'has-client' : 'no-client')}</Text>;
  };

  it('QueryClient를 전달하지 않으면 새로 생성해서 사용한다', async () => {
    const Wrapper = createQueryWrapper();
    const { findByText } = render(<Probe />, { wrapper: Wrapper });

    await waitFor(() => expect(findByText('ok')).resolves.toBeTruthy());
  });

  it('QueryClient를 전달하면 해당 클라이언트를 그대로 사용한다', async () => {
    const client = createQueryClient();
    client.setQueryData(['probe'], 'preset');
    const Wrapper = createQueryWrapper(client);

    const { findByText } = render(<Probe />, { wrapper: Wrapper });

    await waitFor(() => expect(findByText('preset')).resolves.toBeTruthy());
  });
});
