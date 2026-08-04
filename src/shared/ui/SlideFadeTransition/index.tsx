import { ReactNode } from 'react';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';

export type TabTransitionDirection = 'left' | 'right' | null;

const FAST_DURATION = 200;

// 푸터 탭 전환(src/app/(tabs)/_layout.tsx의 tabSlideInterpolator)과 동일한 커브
const FOOTER_EASING = Easing.out(Easing.cubic);

interface SlideFadeTransitionProps {
  direction: TabTransitionDirection;
  duration?: number;
  /** 지정 시, 화면 폭 전체가 아니라 이 픽셀만큼만 이동 + 페이드하는 푸터 탭 전환과 동일한 애니메이션을 사용 */
  offset?: number;
  children: ReactNode;
}

export function SlideFadeTransition({
  direction,
  duration = FAST_DURATION,
  offset,
  children,
}: SlideFadeTransitionProps) {
  if (!direction) {
    return <>{children}</>;
  }

  if (offset != null) {
    const FadeSlideIn = direction === 'right' ? FadeInRight : FadeInLeft;
    const translateX = direction === 'right' ? offset : -offset;
    const entering = FadeSlideIn.duration(duration)
      .easing(FOOTER_EASING)
      .withInitialValues({ transform: [{ translateX }] });

    return (
      <Animated.View key={direction} entering={entering} style={{ flex: 1 }}>
        {children}
      </Animated.View>
    );
  }

  const SlideIn = direction === 'right' ? SlideInRight : SlideInLeft;

  return (
    <Animated.View key={direction} entering={FadeIn.duration(duration)} style={{ flex: 1 }}>
      <Animated.View entering={SlideIn.duration(duration)} style={{ flex: 1 }}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
