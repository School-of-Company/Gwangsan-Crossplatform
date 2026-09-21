import { renderHook } from '@testing-library/react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useBottomSheetScrollLock } from '../useBottomSheetScrollLock';

const scrollEvent = (y: number) =>
  ({ nativeEvent: { contentOffset: { y } } }) as NativeSyntheticEvent<NativeScrollEvent>;

describe('useBottomSheetScrollLock', () => {
  it('초기에는 잠겨 있지 않다', () => {
    const { result } = renderHook(() => useBottomSheetScrollLock());

    expect(result.current.dragLockRef.current).toBe(false);
  });

  it('스크롤이 맨 위가 아니면 시트 드래그를 잠근다', () => {
    const { result } = renderHook(() => useBottomSheetScrollLock());

    result.current.handleScroll(scrollEvent(120));

    expect(result.current.dragLockRef.current).toBe(true);
  });

  it('스크롤이 다시 맨 위로 돌아오면 잠금을 푼다', () => {
    const { result } = renderHook(() => useBottomSheetScrollLock());

    result.current.handleScroll(scrollEvent(120));
    result.current.handleScroll(scrollEvent(0));

    expect(result.current.dragLockRef.current).toBe(false);
  });

  it('handleScroll은 리렌더 사이에 참조가 유지된다', () => {
    const { result, rerender } = renderHook(() => useBottomSheetScrollLock());
    const first = result.current.handleScroll;

    rerender({});

    expect(result.current.handleScroll).toBe(first);
  });
});
