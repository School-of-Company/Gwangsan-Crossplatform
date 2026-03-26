import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useRouter } from 'expo-router';
import { withdrawal } from '../../api/withdrawal';
import { removeData } from '~/shared/lib/removeData';
import { clearAuthTokens } from '~/shared/lib/auth';
import { clearCurrentUserId } from '~/shared/lib/getCurrentUserId';
import Toast from 'react-native-toast-message';
import { useWithdrawal } from '../useWithdrawal';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('../../api/withdrawal', () => ({
  withdrawal: jest.fn(),
}));
jest.mock('~/shared/lib/removeData', () => ({
  removeData: jest.fn(),
}));
jest.mock('~/shared/lib/auth', () => ({
  clearAuthTokens: jest.fn(),
}));
jest.mock('~/shared/lib/getCurrentUserId', () => ({
  clearCurrentUserId: jest.fn(),
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockUseRouter = useRouter as jest.Mock;
const mockWithdrawal = withdrawal as jest.Mock;
const mockRemoveData = removeData as jest.Mock;
const mockClearAuthTokens = clearAuthTokens as jest.Mock;
const mockClearCurrentUserId = clearCurrentUserId as jest.Mock;

describe('useWithdrawal', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ replace: mockReplace });
    mockRemoveData.mockResolvedValue(undefined);
    mockClearAuthTokens.mockResolvedValue(undefined);
  });

  it('초기 상태가 올바르다', () => {
    const { result } = renderHookWithProviders(() => useWithdrawal());

    expect(typeof result.current.withdrawal).toBe('function');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('회원탈퇴 성공 시 토큰 삭제 후 온보딩으로 이동한다', async () => {
    mockWithdrawal.mockResolvedValue({ message: 'success' });

    const { result } = renderHookWithProviders(() => useWithdrawal());

    act(() => {
      result.current.withdrawal();
    });

    await waitFor(() => {
      expect(mockClearAuthTokens).toHaveBeenCalled();
      expect(mockRemoveData).toHaveBeenCalledWith('memberId');
      expect(mockClearCurrentUserId).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('토큰 삭제가 완료된 후 온보딩으로 이동한다 (순서 보장)', async () => {
    const callOrder: string[] = [];

    mockWithdrawal.mockResolvedValue({ message: 'success' });
    mockClearAuthTokens.mockImplementation(async () => {
      callOrder.push('clearAuthTokens');
    });
    mockRemoveData.mockImplementation(async () => {
      callOrder.push('removeData');
    });
    mockClearCurrentUserId.mockImplementation(() => {
      callOrder.push('clearCurrentUserId');
    });
    mockReplace.mockImplementation(() => {
      callOrder.push('replace');
    });

    const { result } = renderHookWithProviders(() => useWithdrawal());

    act(() => {
      result.current.withdrawal();
    });

    await waitFor(() => {
      expect(callOrder).toContain('replace');
    });

    expect(callOrder.indexOf('clearAuthTokens')).toBeLessThan(callOrder.indexOf('replace'));
    expect(callOrder.indexOf('removeData')).toBeLessThan(callOrder.indexOf('replace'));
  });

  it('회원탈퇴 진행 중 isLoading이 true이다', async () => {
    let resolveWithdrawal!: (value: { message: string }) => void;
    mockWithdrawal.mockImplementation(
      () =>
        new Promise<{ message: string }>((resolve) => {
          resolveWithdrawal = resolve;
        })
    );

    const { result } = renderHookWithProviders(() => useWithdrawal());

    act(() => {
      result.current.withdrawal();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    act(() => {
      resolveWithdrawal({ message: 'done' });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('회원탈퇴 실패 시 에러 토스트를 표시한다', async () => {
    mockWithdrawal.mockRejectedValue(new Error('Network error'));

    const { result } = renderHookWithProviders(() => useWithdrawal());

    act(() => {
      result.current.withdrawal();
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: '회원탈퇴 실패',
      });
    });
  });

  it('회원탈퇴 실패 시 토큰을 삭제하지 않는다', async () => {
    mockWithdrawal.mockRejectedValue(new Error('Network error'));

    const { result } = renderHookWithProviders(() => useWithdrawal());

    act(() => {
      result.current.withdrawal();
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalled();
    });

    expect(mockClearAuthTokens).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
