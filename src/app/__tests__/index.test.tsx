import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Index from '../index';
import { getAccessToken } from '~/shared/lib/auth';

jest.mock('~/shared/lib/auth', () => ({
  getAccessToken: jest.fn(),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
  };
});

const mockGetAccessToken = getAccessToken as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Index (startup routing)', () => {
  it('토큰이 있으면 /main으로 리다이렉트한다', async () => {
    mockGetAccessToken.mockResolvedValue('valid-token');

    const { getByTestId } = render(<Index />);

    await waitFor(() => expect(getByTestId('redirect')).toHaveTextContent('/main'));
  });

  it('토큰이 없으면 /onboarding으로 리다이렉트한다', async () => {
    mockGetAccessToken.mockResolvedValue(null);

    const { getByTestId } = render(<Index />);

    await waitFor(() => expect(getByTestId('redirect')).toHaveTextContent('/onboarding'));
  });

  it('토큰 조회가 실패하면 /onboarding으로 리다이렉트한다', async () => {
    mockGetAccessToken.mockRejectedValue(new Error('storage read failed'));

    const { getByTestId } = render(<Index />);

    await waitFor(() => expect(getByTestId('redirect')).toHaveTextContent('/onboarding'));
  });

  it('토큰 확인이 끝나기 전에는 아무것도 렌더링하지 않는다', () => {
    mockGetAccessToken.mockReturnValue(new Promise(() => {})); // 영원히 대기

    const { queryByTestId } = render(<Index />);

    expect(queryByTestId('redirect')).toBeNull();
  });
});
