import { act, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { signout } from '../../api/signout';
import { removeData } from '~/shared/lib/removeData';
import { clearCurrentUserId } from '~/shared/lib/getCurrentUserId';
import { renderHookWithProviders } from '~/test-utils';
import { useSignout } from '../useSignout';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('../../api/signout', () => ({
  signout: jest.fn(),
}));
jest.mock('~/shared/lib/removeData', () => ({
  removeData: jest.fn(),
}));
jest.mock('~/shared/lib/getCurrentUserId', () => ({
  clearCurrentUserId: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockSignout = signout as jest.Mock;
const mockRemoveData = removeData as jest.Mock;
const mockClearCurrentUserId = clearCurrentUserId as jest.Mock;

describe('useSignout', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ replace: mockReplace });
    mockRemoveData.mockResolvedValue(undefined);
  });

  it('초기 상태가 올바르다', () => {
    const { result } = renderHookWithProviders(() => useSignout());

    expect(typeof result.current.signout).toBe('function');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('로그아웃 성공 시 memberId 삭제 + userId 초기화 + 온보딩으로 이동한다', async () => {
    mockSignout.mockResolvedValue({ message: 'success' });

    const { result } = renderHookWithProviders(() => useSignout());

    act(() => {
      result.current.signout();
    });

    await waitFor(() => {
      expect(mockRemoveData).toHaveBeenCalledWith('memberId');
      expect(mockClearCurrentUserId).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('로그아웃 성공 시 queryClient를 초기화한다', async () => {
    mockSignout.mockResolvedValue({ message: 'ok' });

    const { result, queryClient } = renderHookWithProviders(() => useSignout());
    jest.spyOn(queryClient, 'clear');

    act(() => {
      result.current.signout();
    });

    await waitFor(() => {
      expect(queryClient.clear).toHaveBeenCalled();
    });
  });

  it('로그아웃 진행 중 isLoading이 true이다', async () => {
    let resolve!: () => void;
    mockSignout.mockImplementation(
      () => new Promise<{ message: string }>((res) => (resolve = () => res({ message: 'ok' })))
    );

    const { result } = renderHookWithProviders(() => useSignout());

    act(() => {
      result.current.signout();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    act(() => resolve());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('로그아웃 실패 시에도 memberId 삭제 + userId 초기화 + 온보딩으로 이동한다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignout.mockRejectedValue(new Error('서버 오류'));

    const origReject = Promise.reject.bind(Promise);
    const rejectSpy = jest.spyOn(Promise, 'reject').mockImplementation((r?: unknown) => {
      const p = origReject(r);
      p.catch(() => {});
      return p;
    });

    const { result } = renderHookWithProviders(() => useSignout());

    act(() => {
      result.current.signout();
    });

    await waitFor(() => {
      expect(mockRemoveData).toHaveBeenCalledWith('memberId');
      expect(mockClearCurrentUserId).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });

    rejectSpy.mockRestore();
  });

  it('로그아웃 실패 시에도 queryClient를 초기화한다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignout.mockRejectedValue(new Error('fail'));

    const origReject = Promise.reject.bind(Promise);
    const rejectSpy = jest.spyOn(Promise, 'reject').mockImplementation((r?: unknown) => {
      const p = origReject(r);
      p.catch(() => {});
      return p;
    });

    const { result, queryClient } = renderHookWithProviders(() => useSignout());
    jest.spyOn(queryClient, 'clear');

    act(() => {
      result.current.signout();
    });

    await waitFor(() => {
      expect(queryClient.clear).toHaveBeenCalled();
    });

    rejectSpy.mockRestore();
  });
});
