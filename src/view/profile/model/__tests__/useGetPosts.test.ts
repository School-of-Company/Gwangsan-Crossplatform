import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetPosts } from '../useGetPosts';
import { getPost } from '../../api/getPosts';

jest.mock('../../api/getPosts', () => ({ getPost: jest.fn() }));

const mockGetPost = getPost as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useGetPosts', () => {
  it('id가 있으면 getPost를 호출하고 데이터를 반환한다', async () => {
    const posts = [{ id: 2, title: '상대방 글' }];
    mockGetPost.mockResolvedValue(posts);

    const { result } = renderHookWithProviders(() => useGetPosts('5'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetPost).toHaveBeenCalledWith('5');
    expect(result.current.data).toEqual(posts);
  });

  it('id가 null이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetPosts(null));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetPost).not.toHaveBeenCalled();
  });

  it('queryKey가 [myPosts, id]이다', async () => {
    mockGetPost.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() => useGetPosts('5'));

    await waitFor(() => expect(queryClient.getQueryState(['myPosts', '5'])).toBeDefined());
  });

  it('API 실패 시 에러 상태가 된다', async () => {
    mockGetPost.mockRejectedValue(new Error('Not found'));

    const { result } = renderHookWithProviders(() => useGetPosts('999'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});
