import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetMemberPosts } from '../useGetMemberPosts';
import { getMemberPosts } from '../../api/getMemberPosts';

jest.mock('../../api/getMemberPosts', () => ({ getMemberPosts: jest.fn() }));

const mockGetMemberPosts = getMemberPosts as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useGetMemberPosts', () => {
  it('id가 있으면 getMemberPosts를 호출하고 데이터를 반환한다', async () => {
    const posts = [{ id: 2, title: '상대방 글' }];
    mockGetMemberPosts.mockResolvedValue(posts);

    const { result } = renderHookWithProviders(() => useGetMemberPosts('5'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMemberPosts).toHaveBeenCalledWith('5');
    expect(result.current.data).toEqual(posts);
  });

  it('id가 null이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetMemberPosts(null));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetMemberPosts).not.toHaveBeenCalled();
  });

  it('queryKey가 [memberPosts, id]이다', async () => {
    mockGetMemberPosts.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() => useGetMemberPosts('5'));

    await waitFor(() => expect(queryClient.getQueryState(['memberPosts', '5'])).toBeDefined());
  });

  it('API 실패 시 에러 상태가 된다', async () => {
    mockGetMemberPosts.mockRejectedValue(new Error('Not found'));

    const { result } = renderHookWithProviders(() => useGetMemberPosts('999'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});
