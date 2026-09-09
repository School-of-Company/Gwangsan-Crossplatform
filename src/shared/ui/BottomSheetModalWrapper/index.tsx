import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
  Animated,
  Easing,
  Keyboard,
  BackHandler,
  PanResponder,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';

interface BottomSheetModalWrapperProps {
  isVisible: boolean;
  onClose: () => void;
  onAnimationComplete?: () => void;
  title: string;
  children: React.ReactNode;
  height?: number;
  hasHeader?: boolean;
  showCloseButton?: boolean;
  // 시트 내부에 세로 스크롤/드래그 콘텐츠(휠 피커 등)가 있을 때, 해당 콘텐츠를
  // 터치하는 동안 true로 세팅해 아래로 끌어 닫는 제스처가 그 터치를 가로채지
  // 않게 한다. 값이 바뀌어도 리렌더가 필요 없도록 ref로 전달한다.
  dragLockRef?: React.MutableRefObject<boolean>;
}

// iOS 시트 프레젠테이션에서 쓰이는 곡선
const APPLE_SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);
// 손가락 이동량을 그대로 반영하면 체감상 너무 많이 움직여서, 이동량에 저항을 준다
const DRAG_RESISTANCE = 0.7;
// 여닫힘 속도를 동일하게 맞춘다
const SHEET_TRANSITION_DURATION = 500;
// 일부 안드로이드 키보드는 입력 중 예측 변환/후보 문구 바가 나타나거나 사라질 때마다
// 높이가 조금 다른 채로 keyboardDidShow를 다시 쏜다(자체 숨김/노출이 아님). 이 변화에
// 맞춰 시트를 매번 다시 애니메이션시키면, 한글 입력 조합 중인 TextInput의 위치가 자꾸
// 바뀌면서 자소가 분리되어 보이는 문제가 생긴다. 실제 키보드 노출/숨김으로 볼 수 있는
// 큰 변화(이 값보다 큰 변화)에만 반응해 그 문제를 피한다.
const KEYBOARD_HEIGHT_CHANGE_THRESHOLD = 80;
// 키보드가 올라왔을 때 시트 바닥이 키보드 상단에 완전히 붙어버리지 않도록 살짝 띄운다.
const KEYBOARD_GAP = 12;

export function BottomSheetModalWrapper({
  isVisible,
  onClose,
  onAnimationComplete,
  title,
  children,
  height,
  hasHeader = true,
  showCloseButton = false,
  dragLockRef,
}: BottomSheetModalWrapperProps) {
  const id = useId();
  const setSheet = useBottomSheetPortalStore((s) => s.setSheet);
  const removeSheet = useBottomSheetPortalStore((s) => s.removeSheet);
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = height ?? (screenHeight * 2) / 3;

  const [show, setShow] = useState(isVisible);
  const translateY = useRef(new Animated.Value(modalHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragStartValue = useRef(0);
  const lastKeyboardHeightRef = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // 시작 시점엔 절대 가로채지 않는다 — 버튼 탭이 정상적으로 눌리게 하기 위함.
        // 아래로 끄는 움직임이 뚜렷해지는 순간(move, capture 단계)에만 시트가
        // 제스처를 가로채, 버튼을 누르고 있던 도중에도 그대로 내려가게 한다.
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          !dragLockRef?.current &&
          gestureState.dy > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5,
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            dragStartValue.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(
            Math.max(0, dragStartValue.current + gestureState.dy * DRAG_RESISTANCE)
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose =
            gestureState.dy * DRAG_RESISTANCE > modalHeight * 0.25 || gestureState.vy > 0.8;
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
        onPanResponderTerminationRequest: () => false,
      }),
    [modalHeight, onClose, translateY, dragLockRef]
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      const nextHeight = e.endCoordinates.height;
      if (Math.abs(nextHeight - lastKeyboardHeightRef.current) < KEYBOARD_HEIGHT_CHANGE_THRESHOLD) {
        return;
      }
      lastKeyboardHeightRef.current = nextHeight;

      Animated.timing(translateY, {
        toValue: -(nextHeight + KEYBOARD_GAP),
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      lastKeyboardHeightRef.current = 0;

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
    if (isVisible) {
      translateY.setValue(modalHeight);
      backdropOpacity.setValue(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    } else if (show) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: modalHeight,
          duration: SHEET_TRANSITION_DURATION,
          useNativeDriver: true,
          easing: APPLE_SHEET_EASING,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: SHEET_TRANSITION_DURATION,
          useNativeDriver: true,
          easing: APPLE_SHEET_EASING,
        }),
      ]).start(() => {
        setShow(false);
        onAnimationComplete?.();
      });
    }
  }, [isVisible, modalHeight, translateY, backdropOpacity, show, onAnimationComplete]);

  // Modal(별도 네이티브 창) 없이 이미 떠 있는 화면 위에 바로 얹기 때문에, 토스트처럼
  // 창 생성 지연이 없다. 시트의 첫 layout이 실제로 커밋된 직후(onLayout)에만
  // 애니메이션을 시작해 첫 프레임이 끊기지 않게 하고, rAF로 한 프레임 더 미뤄 안전
  // 여유를 둔다.
  const handleSheetLayout = useCallback(() => {
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: SHEET_TRANSITION_DURATION,
          useNativeDriver: true,
          easing: APPLE_SHEET_EASING,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: SHEET_TRANSITION_DURATION,
          useNativeDriver: true,
          easing: APPLE_SHEET_EASING,
        }),
      ]).start();
    });
  }, [translateY, backdropOpacity]);

  // Modal의 onRequestClose를 대체 — 안드로이드 뒤로가기를 닫기 동작으로 처리한다
  useEffect(() => {
    if (!show) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => subscription.remove();
  }, [show, onClose]);

  useEffect(() => {
    if (!show) {
      removeSheet(id);
      return undefined;
    }

    setSheet(
      id,
      <View className="flex-1">
        <Animated.View
          className="absolute inset-0 bg-black/50"
          style={{ opacity: backdropOpacity }}
          pointerEvents="none"
        />
        <Pressable className="flex-1 justify-end" onPress={onClose}>
          <Animated.View
            {...panResponder.panHandlers}
            onLayout={handleSheetLayout}
            style={{
              height: modalHeight,
              transform: [{ translateY }],
            }}
            className="rounded-t-[20px] bg-white">
            <Pressable
              className="flex-1 px-4 pt-4"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
              onPress={(e) => e.stopPropagation()}>
              <View className="items-center py-2">
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

    return () => removeSheet(id);
  }, [
    show,
    id,
    setSheet,
    removeSheet,
    backdropOpacity,
    onClose,
    panResponder,
    handleSheetLayout,
    modalHeight,
    translateY,
    insets.bottom,
    hasHeader,
    title,
    showCloseButton,
    children,
  ]);

  return null;
}
