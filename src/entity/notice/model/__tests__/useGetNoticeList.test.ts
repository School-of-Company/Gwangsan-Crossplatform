import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetNoticeList } from '../useGetNoticeList';
import { getNoticeList } from '../../api/getNoticeList';

jest.mock('../../api/getNoticeList', () => ({
  getNoticeList: jest.fn(),
}));

const mockGetNoticeList = getNoticeList as jest.Mock;

describe('useGetNoticeList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('공지 목록을 성공적으로 가져온다', async () => {
    const list = [{ id: 1, title: '공지1', content: '내용1', images: [] }];
    mockGetNoticeList.mockResolvedValue(list);

    const { result } = renderHookWithProviders(() => useGetNoticeList());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(list);
  });

  it('빈 목록을 정상적으로 처리한다', async () => {
    mockGetNoticeList.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGetNoticeList());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('API 실패 시 error 상태가 된다', async () => {
    mockGetNoticeList.mockRejectedValue(new Error('Network error'));

    const { result } = renderHookWithProviders(() => useGetNoticeList());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('queryKey가 ["noticeList"]이다', async () => {
    mockGetNoticeList.mockResolvedValue([]);

    const { result, queryClient } = renderHookWithProviders(() => useGetNoticeList());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = queryClient.getQueryData(['noticeList']);
    expect(cache).toEqual([]);
  });
});
