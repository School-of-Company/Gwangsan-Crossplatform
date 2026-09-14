import { ReactNode } from 'react';
import Animated, { Easing, SlideInLeft, SlideInRight } from 'react-native-reanimated';

export type TabTransitionDirection = 'left' | 'right' | null;

const FAST_DURATION = 200;

// 푸터 탭 전환(src/app/(tabs)/_layout.tsx의 tabSlideInterpolator)과 동일한 커브
const FOOTER_EASING = Easing.out(Easing.cubic);

interface SlideFadeTransitionProps {
  direction: TabTransitionDirection;
  duration?: number;
  /** 지정 시, 화면 폭 전체가 아니라 이 픽셀만큼만 이동하는 푸터 탭 전환과 동일한 애니메이션을 사용 */
  offset?: number;
  children: ReactNode;
}

// 페이드 없이 옆에서 슬라이드해 들어오는 애니메이션만 적용한다(과거에는 opacity 페이드를 함께
// 썼으나 제거했다).
export function SlideFadeTransition({
  direction,
  duration = FAST_DURATION,
  offset,
  children,
}: SlideFadeTransitionProps) {
  if (!direction) {
    return <>{children}</>;
  }

  const SlideIn = direction === 'right' ? SlideInRight : SlideInLeft;

  if (offset != null) {
    const translateX = direction === 'right' ? offset : -offset;
    const entering = SlideIn.duration(duration)
      .easing(FOOTER_EASING)
      .withInitialValues({ transform: [{ translateX }] });

    return (
      <Animated.View key={direction} entering={entering} style={{ flex: 1 }}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View key={direction} entering={SlideIn.duration(duration)} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}
