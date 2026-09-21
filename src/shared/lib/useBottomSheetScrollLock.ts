import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// 바텀시트 안에 세로 스크롤 콘텐츠를 둘 때 쓴다.
// 시트는 아래로 끄는 제스처를 가로채 닫히는데, 스크롤을 내린 상태에서도 그 제스처가
// 먼저 걸리면 내용을 스크롤해 올릴 수 없다. 스크롤이 맨 위가 아닐 때만 잠가서
// "맨 위에서 아래로 당기면 닫힌다"는 동작은 그대로 두고 스크롤을 살린다.
export const useBottomSheetScrollLock = () => {
  const dragLockRef = useRef(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragLockRef.current = event.nativeEvent.contentOffset.y > 0;
  }, []);

  return { dragLockRef, handleScroll };
};
