import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { Button } from '~/shared/ui/Button';

interface AlertModalProps {
  isVisible: boolean;
  message: string;
  cancelText?: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
  isLoading?: boolean;
}

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
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
      Animated.spring(scale, {
        toValue: 1,
        friction: 9,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else if (show) {
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShow(false));
    }
  }, [isVisible, scale, show]);

  if (!show) return null;

  const handleBackdropPress = () => {
    if (!isLoading) onCancel();
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable className="flex-1" disabled={isLoading} onPress={handleBackdropPress}>
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
          <Pressable className="w-full max-w-[320px]" onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{ transform: [{ scale }] }}
              className="w-full gap-4 rounded-2xl bg-white p-6">
              <Text className="text-xl font-bold text-gray-900">{message}</Text>
              <View className="flex-row gap-3">
                <Button variant="neutral" width="flex-1" disabled={isLoading} onPress={onCancel}>
                  {cancelText}
                </Button>
                <Button variant="neutral" width="flex-1" disabled={isLoading} onPress={onConfirm}>
                  <Text className={destructive ? 'text-error-500' : 'text-main-500'}>
                    {confirmText}
                  </Text>
                </Button>
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
