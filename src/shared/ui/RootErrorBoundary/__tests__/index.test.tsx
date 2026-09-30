import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootErrorBoundary } from '../index';

let shouldThrow = true;

function Crashy() {
  if (shouldThrow) throw new Error('5xx from server');
  return <Text>정상 화면</Text>;
}

const renderWithBoundary = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RootErrorBoundary>
        <Crashy />
      </RootErrorBoundary>
    </QueryClientProvider>
  );

beforeEach(() => {
  shouldThrow = true;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RootErrorBoundary', () => {
  it('하위에서 에러가 나면 흰 화면 대신 다시 시도 화면을 보여준다(#740)', () => {
    const { getByText, queryByText } = renderWithBoundary();

    expect(getByText('오류가 발생했습니다')).toBeTruthy();
    expect(getByText('다시 시도')).toBeTruthy();
    expect(queryByText('정상 화면')).toBeNull();
  });

  it('다시 시도를 누르면 하위 화면을 다시 그린다', () => {
    const { getByText } = renderWithBoundary();

    shouldThrow = false;
    fireEvent.press(getByText('다시 시도'));

    expect(getByText('정상 화면')).toBeTruthy();
  });

  it('에러가 없으면 하위 화면을 그대로 보여준다', () => {
    shouldThrow = false;
    const { getByText } = renderWithBoundary();

    expect(getByText('정상 화면')).toBeTruthy();
  });
});
