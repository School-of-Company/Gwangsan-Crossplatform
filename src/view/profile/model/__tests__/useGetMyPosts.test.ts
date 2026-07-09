import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetMyPosts } from '../useGetMyPosts';
import { getMyPosts } from '../../api/getMyPosts';

jest.mock('../../api/getMyPosts', () => ({ getMyPosts: jest.fn() }));

const mockGetMyPosts = getMyPosts as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useGetMyPosts', () => {
  it('isMe=true이면 getMyPosts를 호출하고 데이터를 반환한다', async () => {
    const posts = [{ id: 1, title: '내 글' }];
    mockGetMyPosts.mockResolvedValue(posts);

    const { result } = renderHookWithProviders(() => useGetMyPosts(true));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMyPosts).toHaveBeenCalled();
    expect(result.current.data).toEqual(posts);
  });

  it('isMe=false이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetMyPosts(false));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetMyPosts).not.toHaveBeenCalled();
  });

  it('queryKey가 [myPosts, current]이다', async () => {
    mockGetMyPosts.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() => useGetMyPosts(true));

    await waitFor(() => expect(queryClient.getQueryState(['myPosts', 'current'])).toBeDefined());
  });

  it('API 실패 시 에러 상태가 된다', async () => {
    mockGetMyPosts.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHookWithProviders(() => useGetMyPosts(true));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});
