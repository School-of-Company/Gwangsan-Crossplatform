import { ReactNode } from 'react';
import Animated, { Easing, SlideInLeft, SlideInRight, withTiming } from 'react-native-reanimated';

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

  if (offset != null) {
    const translateX = direction === 'right' ? offset : -offset;
    // Reanimated의 SlideInRight/SlideInLeft는 transform이 아니라 originX(레이아웃 원점)를
    // 애니메이션하고 기본 이동 거리도 화면 전체 너비라, withInitialValues({ transform })로는
    // 이 작은 offset이 전혀 반영되지 않는다 — 항상 프리셋 자체의 전체 화면 너비 슬라이드가
    // 그대로 적용돼, 뒤로가기(direction: 'left')에서도 앞으로 갈 때와 체감상 구분이 안 갔다.
    // transform.translateX만 직접 애니메이션하는 커스텀 워클릿으로 대체해, 지정한 offset만큼만
    // 정확히 반대 방향으로 움직이게 한다.
    const entering = () => {
      'worklet';
      return {
        initialValues: { transform: [{ translateX }] },
        animations: {
          transform: [{ translateX: withTiming(0, { duration, easing: FOOTER_EASING }) }],
        },
      };
    };

    return (
      <Animated.View key={direction} entering={entering} style={{ flex: 1 }}>
        {children}
      </Animated.View>
    );
  }

  const SlideIn = direction === 'right' ? SlideInRight : SlideInLeft;

  return (
    <Animated.View key={direction} entering={SlideIn.duration(duration)} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}
