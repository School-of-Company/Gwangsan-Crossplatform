import { act, renderHook } from '@testing-library/react-native';
import { usePullToRefresh } from '../usePullToRefresh';

describe('usePullToRefresh', () => {
  it('refetch 동안만 refreshing이 true다', async () => {
    let resolve!: () => void;
    const refetch = jest.fn(() => new Promise<void>((r) => (resolve = r)));
    const { result } = renderHook(() => usePullToRefresh(refetch));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.onRefresh();
    });
    expect(result.current.refreshing).toBe(true);

    await act(async () => {
      resolve();
      await pending;
    });
    expect(result.current.refreshing).toBe(false);
  });

  it('refetch가 실패해도 refreshing을 되돌린다', async () => {
    const refetch = jest.fn().mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => usePullToRefresh(refetch));

    await act(async () => {
      await result.current.onRefresh().catch(() => {});
    });
    expect(result.current.refreshing).toBe(false);
  });
});
