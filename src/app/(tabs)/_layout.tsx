import { Tabs } from 'expo-router';
import { Animated, Easing } from 'react-native';
import { AppFooter } from '~/widget/write/ui/AppFooter';

const HORIZONTAL_SHIFT = 32;
const TRANSITION_DURATION = 100;

function tabSlideInterpolator({ current }: { current: { progress: Animated.Value } }) {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
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
