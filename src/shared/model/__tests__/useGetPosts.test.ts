import { waitFor } from '@testing-library/react-native';
import * as ReactQuery from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Toast from 'react-native-toast-message';
import { renderHookWithProviders } from '~/test-utils';
import { useGetPosts } from '../useGetPosts';
import { getPosts } from '../../api/getPosts';

jest.mock('../../api/getPosts', () => ({
  getPosts: jest.fn(),
}));
jest.mock('react-native-toast-message', () => ({ show: jest.fn() }));

// @tanstack/react-query's named exports aren't configurable under this
// project's transform, so `jest.spyOn(ReactQuery, 'useQuery')` throws
// ("Cannot redefine property"). Wrapping useQuery via jest.mock instead lets
// us capture the options it's called with while still delegating to the
// real implementation for actual query behavior.
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return { ...actual, useQuery: jest.fn(actual.useQuery) };
});

const mockGetPosts = getPosts as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;
const mockUseQuery = ReactQuery.useQuery as jest.Mock;

const makeAxiosError = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', { headers: {} } as any, null, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: { headers: {} } as any,
  });

// useGetPosts는 useQuery에 넘기는 throwOnError를 직접 호출할 방법이 없으므로,
// 목으로 감싼 useQuery가 받은 옵션에서 throwOnError만 꺼내 직접 호출한다.
const getThrowOnError = () => {
  renderHookWithProviders(() => useGetPosts());
  const options = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0] as {
    throwOnError: (error: unknown) => boolean;
  };
  return options.throwOnError;
};

const makePosts = () => [
  { id: 1, title: '게시글', imageUrls: [], isCompletable: false, isCompleted: false },
];

describe('useGetPosts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getPosts를 호출하고 데이터를 반환한다', async () => {
    mockGetPosts.mockResolvedValue(makePosts());

    const { result } = renderHookWithProviders(() => useGetPosts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(makePosts());
  });

  it('queryKey에 mode와 type을 포함한다', async () => {
    mockGetPosts.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() => useGetPosts('GIVER', 'OBJECT'));

    await waitFor(() =>
      expect(queryClient.getQueryState(['posts', 'GIVER', 'OBJECT'])).toBeDefined()
    );
  });

  it('params 없이 호출하면 queryKey가 [posts, undefined, undefined]이다', async () => {
    mockGetPosts.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() => useGetPosts());

    await waitFor(() =>
      expect(queryClient.getQueryState(['posts', undefined, undefined])).toBeDefined()
    );
  });

  it('getPosts에 type과 mode 순서대로 전달한다', async () => {
    mockGetPosts.mockResolvedValue([]);

    renderHookWithProviders(() => useGetPosts('GIVER', 'OBJECT'));

    await waitFor(() => expect(mockGetPosts).toHaveBeenCalledWith('OBJECT', 'GIVER'));
  });

  describe('throwOnError', () => {
    it('5xx 응답이면 토스트 없이 true를 반환해 ErrorBoundary로 던진다', () => {
      mockGetPosts.mockResolvedValue([]);
      const throwOnError = getThrowOnError();

      expect(throwOnError(makeAxiosError(500))).toBe(true);
      expect(mockToastShow).not.toHaveBeenCalled();
    });

    it('4xx 응답이면 토스트를 띄우고 false를 반환한다', () => {
      mockGetPosts.mockResolvedValue([]);
      const throwOnError = getThrowOnError();

      expect(throwOnError(makeAxiosError(404))).toBe(false);
      expect(mockToastShow).toHaveBeenCalledWith({
        type: 'error',
        text1: '게시물 불러오기 실패',
        text2: 'failed',
      });
    });

    it('AxiosError가 아니면 토스트를 띄우고 false를 반환한다', () => {
      mockGetPosts.mockResolvedValue([]);
      const throwOnError = getThrowOnError();
      const error = new Error('network down');

      expect(throwOnError(error)).toBe(false);
      expect(mockToastShow).toHaveBeenCalledWith({
        type: 'error',
        text1: '게시물 불러오기 실패',
        text2: 'network down',
      });
    });

    it('status가 없는 AxiosError면 토스트를 띄우고 false를 반환한다', () => {
      mockGetPosts.mockResolvedValue([]);
      const throwOnError = getThrowOnError();
      const error = new AxiosError('no response', 'ERR_NETWORK');

      expect(throwOnError(error)).toBe(false);
      expect(mockToastShow).toHaveBeenCalledWith({
        type: 'error',
        text1: '게시물 불러오기 실패',
        text2: 'no response',
      });
    });
  });
});
