import { Tabs } from 'expo-router';
import { Animated, Easing } from 'react-native';
import { AppFooter } from '~/widget/write/ui/AppFooter';

const HORIZONTAL_SHIFT = 32;
const TRANSITION_DURATION = 100;

// 페이드 없이 콘텐츠(sceneStyle)만 옆으로 살짝 슬라이드한다. 탭 바(AppFooter)는
// tabBar prop으로 별도 렌더링되는 고정 UI라 이 애니메이션과 무관하게 항상 그 자리에
// 머문다 — 콘텐츠만 움직이고 푸터는 가만히 있는 효과가 별도 처리 없이 그대로 나온다.
function tabSlideInterpolator({ current }: { current: { progress: Animated.Value } }) {
  return {
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-HORIZONTAL_SHIFT, 0, HORIZONTAL_SHIFT],
          }),
        },
      ],
    },
  };
}

const fastSlideSpec = {
  animation: 'timing' as const,
  config: { duration: TRANSITION_DURATION, easing: Easing.out(Easing.cubic) },
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppFooter {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyleInterpolator: tabSlideInterpolator,
        transitionSpec: fastSlideSpec,
      }}>
      <Tabs.Screen name="main" />
      <Tabs.Screen name="chatting" />
      <Tabs.Screen name="notice" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
