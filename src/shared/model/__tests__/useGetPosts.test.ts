import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetPosts } from '../useGetPosts';
import { getPosts } from '../../api/getPosts';

jest.mock('../../api/getPosts', () => ({
  getPosts: jest.fn(),
}));

const mockGetPosts = getPosts as jest.Mock;

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
});
