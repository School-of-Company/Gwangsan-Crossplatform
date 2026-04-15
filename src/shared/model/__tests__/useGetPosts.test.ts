import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetPosts } from '../useGetPosts';
import { getPosts } from '../../api/getPosts';

jest.mock('../../api/getPosts', () => ({
  getPosts: jest.fn(),
}));

const mockGetPosts = getPosts as jest.Mock;

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '제목',
  content: '내용',
  gwangsan: 100,
  type: 'SELL',
  mode: 'NORMAL',
  imageUrls: [],
  isCompletable: false,
  isCompleted: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useGetPosts', () => {
  it('게시물 목록을 반환한다', async () => {
    mockGetPosts.mockResolvedValue([makePost()]);

    const { result } = renderHookWithProviders(() => useGetPosts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe(1);
  });

  it('mode와 type을 getPosts에 전달한다', async () => {
    mockGetPosts.mockResolvedValue([]);

    renderHookWithProviders(() => useGetPosts('NORMAL', 'SELL'));

    await waitFor(() => expect(mockGetPosts).toHaveBeenCalledWith('SELL', 'NORMAL'));
  });

  it('파라미터 없이 호출하면 undefined로 전달한다', async () => {
    mockGetPosts.mockResolvedValue([]);

    renderHookWithProviders(() => useGetPosts());

    await waitFor(() => expect(mockGetPosts).toHaveBeenCalledWith(undefined, undefined));
  });

  it('queryKey에 mode와 type이 포함된다', async () => {
    mockGetPosts.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGetPosts('GWANGSAN', 'BUY'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetPosts).toHaveBeenCalledWith('BUY', 'GWANGSAN');
  });

  it('API 에러 발생 시 isError가 true이다', async () => {
    mockGetPosts.mockRejectedValue(new Error('서버 오류'));

    const { result } = renderHookWithProviders(() => useGetPosts(), {
      queryClientOptions: { defaultOptions: { queries: { retry: false } } },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
