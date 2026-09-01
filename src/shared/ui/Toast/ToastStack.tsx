import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import type { ToastConfigParams } from 'react-native-toast-message';
import { useToastQueueStore } from '~/shared/lib/toastQueue';
import '~/shared/lib/toastQueuePatch';
import { toastConfig } from './index';

interface ToastStackProps {
  readonly topOffset?: number;
}

export function ToastStack({ topOffset = 40 }: ToastStackProps) {
  const toasts = useToastQueueStore((state) => state.toasts);

  return (
    <View
      testID="toast-stack"
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center gap-2"
      style={{ top: topOffset }}>
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.springify().damping(18)}
          exiting={FadeOutUp.duration(150)}
          layout={LinearTransition.springify().damping(18)}>
          {toastConfig[toast.type]?.({
            type: toast.type,
            text1: toast.text1,
            text2: toast.text2,
            onPress: toast.onPress ?? (() => {}),
            position: 'top',
            isVisible: true,
            show: () => {},
            hide: () => {},
            props: undefined,
          } as ToastConfigParams<unknown>)}
        </Animated.View>
      ))}
    </View>
  );
}
