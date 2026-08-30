import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useBlockUser } from '../useBlockUser';
import { blockUser, unblockUser } from '../../api/blockUser';
import Toast from 'react-native-toast-message';

jest.mock('../../api/blockUser', () => ({ blockUser: jest.fn(), unblockUser: jest.fn() }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockBlockUser = blockUser as jest.Mock;
const mockUnblockUser = unblockUser as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useBlockUser', () => {
  it('block 성공 시 blockList를 invalidate하고 성공 Toast를 표시한다', async () => {
    mockBlockUser.mockResolvedValue({});

    const { result, queryClient } = renderHookWithProviders(() => useBlockUser(7));
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.block.mutate();
    });

    await waitFor(() => expect(result.current.block.isSuccess).toBe(true));
    expect(mockBlockUser).toHaveBeenCalledWith(7);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['blockList'] });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '차단되었습니다.' })
    );
  });

  it('block 실패 시 에러 Toast를 표시한다', async () => {
    mockBlockUser.mockRejectedValue(new Error('실패'));

    const { result } = renderHookWithProviders(() => useBlockUser(7));

    await act(async () => {
      result.current.block.mutate();
    });

    await waitFor(() => expect(result.current.block.isError).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '차단에 실패했습니다.' })
    );
  });

  it('targetMemberId가 undefined이면 block mutation이 에러를 던진다', async () => {
    const { result } = renderHookWithProviders(() => useBlockUser(undefined));

    await act(async () => {
      result.current.block.mutate();
    });

    await waitFor(() => expect(result.current.block.isError).toBe(true));
    expect(mockBlockUser).not.toHaveBeenCalled();
  });

  it('unblock 성공 시 blockList를 invalidate하고 성공 Toast를 표시한다', async () => {
    mockUnblockUser.mockResolvedValue({});

    const { result, queryClient } = renderHookWithProviders(() => useBlockUser(7));
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.unblock.mutate();
    });

    await waitFor(() => expect(result.current.unblock.isSuccess).toBe(true));
    expect(mockUnblockUser).toHaveBeenCalledWith(7);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['blockList'] });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '차단이 해제되었습니다.' })
    );
  });

  it('unblock 실패 시 에러 Toast를 표시한다', async () => {
    mockUnblockUser.mockRejectedValue(new Error('실패'));

    const { result } = renderHookWithProviders(() => useBlockUser(7));

    await act(async () => {
      result.current.unblock.mutate();
    });

    await waitFor(() => expect(result.current.unblock.isError).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '차단 해제에 실패했습니다.' })
    );
  });

  it('targetMemberId가 undefined이면 unblock mutation이 에러를 던진다', async () => {
    const { result } = renderHookWithProviders(() => useBlockUser(undefined));

    await act(async () => {
      result.current.unblock.mutate();
    });

    await waitFor(() => expect(result.current.unblock.isError).toBe(true));
    expect(mockUnblockUser).not.toHaveBeenCalled();
  });
});
