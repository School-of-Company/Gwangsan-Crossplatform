import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetBlockList } from '../useGetBlockList';
import { getBlockList } from '../../api/getBlockList';

jest.mock('../../api/getBlockList', () => ({ getBlockList: jest.fn() }));

const mockGetBlockList = getBlockList as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useGetBlockList', () => {
  it('getBlockList를 호출하고 데이터를 반환한다', async () => {
    mockGetBlockList.mockResolvedValue([{ memberId: 3, nickname: '차단됨' }]);

    const { result } = renderHookWithProviders(() => useGetBlockList());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetBlockList).toHaveBeenCalled();
    expect(result.current.data).toEqual([{ memberId: 3, nickname: '차단됨' }]);
  });

  it('queryKey가 [blockList]이다', async () => {
    mockGetBlockList.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() => useGetBlockList());

    await waitFor(() => expect(queryClient.getQueryState(['blockList'])).toBeDefined());
  });

  it('API 실패 시 에러 상태가 된다', async () => {
    mockGetBlockList.mockRejectedValue(new Error('실패'));

    const { result } = renderHookWithProviders(() => useGetBlockList());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('실패');
  });
});
