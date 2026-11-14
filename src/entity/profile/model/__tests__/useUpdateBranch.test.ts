import { act, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { renderHookWithProviders } from '~/test-utils';
import { useUpdateBranch } from '../useUpdateBranch';
import { updateBranch } from '../../api/updateBranch';

jest.mock('../../api/updateBranch', () => ({ updateBranch: jest.fn() }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockUpdateBranch = updateBranch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useUpdateBranch', () => {
  it('성공 시 내 프로필·내 정보 쿼리를 invalidate하고 성공 Toast를 표시한다', async () => {
    mockUpdateBranch.mockResolvedValue(undefined);

    const { result, queryClient } = renderHookWithProviders(() => useUpdateBranch());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({ placeId: 3 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateBranch).toHaveBeenCalledWith({ placeId: 3 });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text2: '지점이 변경되었습니다.' })
    );
  });

  it('실패 시 에러 메시지를 담은 에러 Toast를 표시한다', async () => {
    mockUpdateBranch.mockRejectedValue(new Error('존재하지 않는 지점입니다.'));

    const { result } = renderHookWithProviders(() => useUpdateBranch());

    await act(async () => {
      result.current.mutate({ placeId: 999 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '오류', text2: '존재하지 않는 지점입니다.' })
    );
  });
});
