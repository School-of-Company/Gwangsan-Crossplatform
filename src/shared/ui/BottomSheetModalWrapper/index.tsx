import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
  Animated,
  Easing,
  Keyboard,
  Platform,
  PanResponder,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import * as NavigationBar from 'expo-navigation-bar';
import { useFooterVisibilityStore } from '~/shared/store/useFooterVisibilityStore';

interface BottomSheetModalWrapperProps {
  isVisible: boolean;
  onClose: () => void;
  onAnimationComplete?: () => void;
  title: string;
  children: React.ReactNode;
  height?: number;
  hasHeader?: boolean;
  showCloseButton?: boolean;
}

// iOS 시트 프레젠테이션에서 쓰이는 곡선
const APPLE_SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);

export function BottomSheetModalWrapper({
  isVisible,
  onClose,
  onAnimationComplete,
  title,
  children,
  height,
  hasHeader = true,
  showCloseButton = true,
}: BottomSheetModalWrapperProps) {
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = height ?? (screenHeight * 2) / 3;

  const [show, setShow] = useState(isVisible);
  const translateY = useRef(new Animated.Value(modalHeight)).current;
  const dragStartValue = useRef(0);
  const hideFooter = useFooterVisibilityStore((state) => state.hide);
  const showFooter = useFooterVisibilityStore((state) => state.show);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            dragStartValue.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(Math.max(0, dragStartValue.current + gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose = gestureState.dy > modalHeight * 0.25 || gestureState.vy > 0.8;
          if (shouldClose) {
            onClose();
          } else {
            Animated.timing(translateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }).start();
          }
        },
      }),
    [modalHeight, onClose, translateY]
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [translateY]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setVisibilityAsync(isVisible ? 'hidden' : 'visible').catch(() => {});
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      hideFooter();
    } else {
      showFooter();
    }
  }, [isVisible, hideFooter, showFooter]);

  useEffect(() => {
    if (isVisible) {
      translateY.setValue(modalHeight);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    } else if (show) {
      Animated.timing(translateY, {
        toValue: modalHeight,
        duration: 300,
        useNativeDriver: true,
        easing: APPLE_SHEET_EASING,
      }).start(() => {
        setShow(false);
        onAnimationComplete?.();
      });
    }
  }, [isVisible, modalHeight, translateY, show, onAnimationComplete]);

  // show가 true로 커밋되어 시트가 오프스크린 위치에 실제로 마운트된 다음에만
  // 여는 애니메이션을 시작한다. 마운트 전에 시작하면 애니메이션 시계가 이미
  // 흐르고 있는 상태로 뷰가 붙어 중간부터 나타나는 것처럼 보이는 문제가 있었다.
  useEffect(() => {
    if (!isVisible || !show) return;

    Animated.timing(translateY, {
      toValue: 0,
      duration: 380,
      useNativeDriver: true,
      easing: APPLE_SHEET_EASING,
    }).start();
  }, [isVisible, show, translateY]);

  if (!show) return null;

  return (
    <View className="absolute inset-0 z-[1000]">
      <Pressable className="flex-1 justify-end" onPress={onClose}>
        <Animated.View
          style={{
            height: modalHeight,
            transform: [{ translateY }],
          }}
          className="rounded-t-[20px] bg-white">
          <Pressable className="flex-1 p-4" onPress={(e) => e.stopPropagation()}>
            <View
              {...panResponder.panHandlers}
              hitSlop={{ top: 12, bottom: 12, left: 40, right: 40 }}
              className="items-center py-2">
              <View className="h-1 w-10 rounded-full bg-gray-200" />
            </View>
            {hasHeader && (
              <View className="relative mb-4 flex-row items-center justify-center py-6">
                <Text className="text-body1 text-black">{title}</Text>
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    className="absolute right-0"
                    style={{ right: 0 }}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View className="flex-1">{children}</View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </View>
  );
}
