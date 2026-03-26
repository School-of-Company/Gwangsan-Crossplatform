import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import type { RenderOptions, RenderHookOptions } from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { createQueryClient, createQueryWrapper } from './createQueryWrapper';

interface ProvidersOptions {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { queryClient, ...renderOptions }: ProvidersOptions & Omit<RenderOptions, 'wrapper'> = {}
) {
  const client = queryClient ?? createQueryClient();
  return {
    ...render(ui, { wrapper: createQueryWrapper(client), ...renderOptions }),
    queryClient: client,
  };
}

export function renderHookWithProviders<T>(
  hook: () => T,
  { queryClient, ...hookOptions }: ProvidersOptions & Omit<RenderHookOptions<T>, 'wrapper'> = {}
) {
  const client = queryClient ?? createQueryClient();
  return {
    ...renderHook(hook, { wrapper: createQueryWrapper(client), ...hookOptions }),
    queryClient: client,
  };
}
