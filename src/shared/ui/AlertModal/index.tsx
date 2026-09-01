import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { Button } from '~/shared/ui/Button';

interface AlertModalProps {
  isVisible: boolean;
  message: string;
  cancelText?: string;
  confirmText: string;
  // 확인 버튼 하나만 필요한 안내창은 onCancel을 생략한다 — 취소 버튼이 사라지고
  // 확인 버튼이 전체 너비를 차지하며, 배경/뒤로가기도 onConfirm으로 닫힌다.
  onCancel?: () => void;
  onConfirm: () => void;
  destructive?: boolean;
  isLoading?: boolean;
}

// iOS UIAlertController가 뜰 때 살짝 확대된 상태(1.1배)에서 축소되며 페이드인되는
// 값 — Material처럼 작은 상태에서 커지는 게 아니라 큰 상태에서 줄어드는 게 Apple 특유의 느낌
const ALERT_ENTER_SCALE = 1.1;
const ALERT_EXIT_SCALE = 0.85;
const ALERT_TRANSITION_DURATION = 200;

export function AlertModal({
  isVisible,
  message,
  cancelText = '취소',
  confirmText,
  onCancel,
  onConfirm,
  destructive = false,
  isLoading = false,
}: AlertModalProps) {
  const [show, setShow] = useState(isVisible);
  const scale = useRef(new Animated.Value(ALERT_ENTER_SCALE)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // 취소 버튼은 애니메이션 없이 즉시 닫혀야 해서, 다음 닫힘이 취소로 인한 것인지 표시해둔다
  const skipCloseAnimationRef = useRef(false);
  const dismiss = onCancel ?? onConfirm;

  useEffect(() => {
    if (isVisible) {
      scale.setValue(ALERT_ENTER_SCALE);
      opacity.setValue(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 9,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ALERT_TRANSITION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (show) {
      if (skipCloseAnimationRef.current) {
        skipCloseAnimationRef.current = false;
        setShow(false);
        return;
      }
      Animated.parallel([
        Animated.timing(scale, {
          toValue: ALERT_EXIT_SCALE,
          duration: ALERT_TRANSITION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: ALERT_TRANSITION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setShow(false));
    }
  }, [isVisible, scale, opacity, show]);

  if (!show) return null;

  const handleBackdropPress = () => {
    if (!isLoading) dismiss();
  };

  const handleCancelPress = () => {
    skipCloseAnimationRef.current = true;
    onCancel?.();
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <Pressable className="flex-1" disabled={isLoading} onPress={handleBackdropPress}>
        <Animated.View
          style={{ opacity }}
          className="flex-1 items-center justify-center bg-black/40 px-8">
          <Pressable className="w-full max-w-[320px]" onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{ transform: [{ scale }] }}
              className="w-full gap-4 rounded-2xl bg-white p-6">
              <Text className="text-xl font-bold text-gray-900">{message}</Text>
              <View className="flex-row gap-3">
                {onCancel && (
                  <Button
                    variant="neutral"
                    width="flex-1"
                    disabled={isLoading}
                    onPress={handleCancelPress}>
                    {cancelText}
                  </Button>
                )}
                <Button variant="neutral" width="flex-1" disabled={isLoading} onPress={onConfirm}>
                  <Text className={destructive ? 'text-error-500' : 'text-main-500'}>
                    {confirmText}
                  </Text>
                </Button>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
