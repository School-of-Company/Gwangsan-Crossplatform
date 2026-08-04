import { ReactNode } from 'react';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';

export type TabTransitionDirection = 'left' | 'right' | null;

const FAST_DURATION = 200;

interface SlideFadeTransitionProps {
  direction: TabTransitionDirection;
  duration?: number;
  children: ReactNode;
}

export function SlideFadeTransition({
  direction,
  duration = FAST_DURATION,
  children,
}: SlideFadeTransitionProps) {
  if (!direction) {
    return <>{children}</>;
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
