import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetSellingPosts } from '../useGetSellingPosts';
import { getSellingPosts } from '../../api/getSellingPosts';

jest.mock('../../api/getSellingPosts', () => ({
  getSellingPosts: jest.fn(),
  SELLING_PAGE_SIZE: 20,
}));

const mockGetSellingPosts = getSellingPosts as jest.Mock;

const makePosts = (ids: number[], overrides: Record<string, unknown> = {}) =>
  ids.map((id) => ({ id, mode: 'GIVER', isCompleted: false, ...overrides }));

beforeEach(() => jest.clearAllMocks());

describe('useGetSellingPosts', () => {
  it('첫 페이지는 last_id 없이 조회한다', async () => {
    mockGetSellingPosts.mockResolvedValue(makePosts([3, 2, 1]));

    const { result } = renderHookWithProviders(() =>
      useGetSellingPosts({ completed: false, size: 3 })
    );

    await waitFor(() => expect(result.current.posts).toHaveLength(3));
    expect(mockGetSellingPosts).toHaveBeenCalledWith({
      memberId: undefined,
      completed: false,
      type: undefined,
      size: 3,
      lastId: null,
    });
  });

  it('회원·completed·size별로 쿼리 키가 분리된다', async () => {
    mockGetSellingPosts.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() =>
      useGetSellingPosts({ memberId: '5', completed: true, size: 20 })
    );

    await waitFor(() =>
      expect(
        queryClient.getQueryState([
          'sellingPosts',
          '5',
          { completed: true, type: undefined, size: 20 },
        ])
      ).toBeDefined()
    );
  });

  it('정확히 size개가 오면 마지막 게시글 id를 커서로 다음 페이지를 이어 받는다', async () => {
    mockGetSellingPosts
      .mockResolvedValueOnce(makePosts([5, 4]))
      .mockResolvedValueOnce(makePosts([3]));

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 2 }));

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    result.current.loadMore();

    await waitFor(() => expect(result.current.posts).toHaveLength(3));
    expect(mockGetSellingPosts).toHaveBeenLastCalledWith(expect.objectContaining({ lastId: 4 }));
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  });

  it('size보다 적게 오면 더 불러오지 않는다', async () => {
    mockGetSellingPosts.mockResolvedValue(makePosts([2, 1]));

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 20 }));

    await waitFor(() => expect(result.current.posts).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('빈 배열이 오면 목록이 비고 더 불러오지 않는다', async () => {
    mockGetSellingPosts.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 20 }));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.posts).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('서버가 페이지 파라미터를 무시하고 같은 배열을 주면 커서가 전진하지 않아 멈춘다', async () => {
    // 대상 환경에 아직 서버 변경이 반영되지 않은 경우 — 무한히 같은 페이지를 받지 않는다.
    mockGetSellingPosts.mockResolvedValue(makePosts([5, 4]));

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 2 }));

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    result.current.loadMore();

    await waitFor(() => expect(mockGetSellingPosts).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    // 중복 id는 걸러져 카드가 두 번 그려지지 않는다.
    expect(result.current.posts.map((post) => post.id)).toEqual([5, 4]);
  });

  it('GIVER가 아닌 게시글은 걸러낸다', async () => {
    mockGetSellingPosts.mockResolvedValue([
      { id: 2, mode: 'GIVER' },
      { id: 1, mode: 'RECEIVER' },
    ]);

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 20 }));

    await waitFor(() => expect(result.current.posts).toHaveLength(1));
    expect(result.current.posts[0].id).toBe(2);
  });

  it('이미 다음 페이지를 불러오는 중이면 loadMore가 중복 요청하지 않는다', async () => {
    mockGetSellingPosts.mockResolvedValue(makePosts([5, 4]));

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 2 }));

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    result.current.loadMore();
    result.current.loadMore();
    result.current.loadMore();

    await waitFor(() => expect(mockGetSellingPosts).toHaveBeenCalledTimes(2));
  });

  it('더 받을 페이지가 없으면 loadMore가 아무 요청도 하지 않는다', async () => {
    mockGetSellingPosts.mockResolvedValue(makePosts([1]));

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 20 }));

    await waitFor(() => expect(result.current.posts).toHaveLength(1));

    result.current.loadMore();

    expect(mockGetSellingPosts).toHaveBeenCalledTimes(1);
  });

  it('enabled=false이면 조회하지 않는다', () => {
    renderHookWithProviders(() => useGetSellingPosts({ enabled: false }));

    expect(mockGetSellingPosts).not.toHaveBeenCalled();
  });

  it('첫 페이지 실패는 에러 상태로 전달한다', async () => {
    mockGetSellingPosts.mockRejectedValue(new Error('불러오기 실패'));

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 20 }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('불러오기 실패');
  });

  it('추가 페이지만 실패하면 기존 목록은 유지하고 isFetchNextPageError가 된다', async () => {
    mockGetSellingPosts
      .mockResolvedValueOnce(makePosts([5, 4]))
      .mockRejectedValueOnce(new Error('추가 로딩 실패'));

    const { result } = renderHookWithProviders(() => useGetSellingPosts({ size: 2 }));

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    result.current.loadMore();

    await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true));
    expect(result.current.posts).toHaveLength(2);
  });
});
