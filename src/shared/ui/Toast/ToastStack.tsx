import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import type { ToastConfigParams } from 'react-native-toast-message';
import { useToastQueueStore } from '~/shared/lib/toastQueue';
import '~/shared/lib/toastQueuePatch';
import { toastConfig } from './index';

interface ToastStackProps {
  readonly topOffset?: number;
}

export function ToastStack({ topOffset = 40 }: ToastStackProps) {
  const toasts = useToastQueueStore((state) => state.toasts);
  // 최신 토스트가 맨 위에 오도록 뒤집어서 렌더링한다 — 새 토스트가 위에서 내려와 자리를
  // 차지하면 기존 토스트들은 그 아래로 밀려난다.
  const displayToasts = [...toasts].reverse();

  return (
    <View
      testID="toast-stack"
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center gap-2"
      style={{ top: topOffset }}>
      {displayToasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(150)}
          layout={LinearTransition.duration(220)}>
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
