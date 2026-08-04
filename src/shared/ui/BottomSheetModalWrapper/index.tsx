import { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import * as NavigationBar from 'expo-navigation-bar';

interface BottomSheetModalWrapperProps {
  isVisible: boolean;
  onClose: () => void;
  onAnimationComplete?: () => void;
  title: string;
  children: React.ReactNode;
  height?: number;
  hasHeader?: boolean;
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
}: BottomSheetModalWrapperProps) {
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = height ?? (screenHeight * 2) / 3;

  const [show, setShow] = useState(isVisible);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(modalHeight)).current;

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
      translateY.setValue(modalHeight);
      overlayOpacity.setValue(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
        easing: APPLE_SHEET_EASING,
      }).start();
    } else if (show) {
      Animated.timing(translateY, {
        toValue: modalHeight,
        duration: 300,
        useNativeDriver: true,
        easing: APPLE_SHEET_EASING,
      }).start(() => {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(() => {
          setShow(false);
          onAnimationComplete?.();
        });
      });
    }
  }, [isVisible, modalHeight, overlayOpacity, translateY, show, onAnimationComplete]);

  if (!show) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        opacity: overlayOpacity,
        zIndex: 1000,
      }}
      className="absolute inset-0 z-[1000] bg-black/50">
      <Pressable className="flex-1 justify-end" onPress={onClose}>
        <Animated.View
          style={{
            height: modalHeight,
            transform: [{ translateY }],
          }}
          className="rounded-t-[20px] bg-white">
          <Pressable className="flex-1 p-4" onPress={(e) => e.stopPropagation()}>
            <View className="mb-1 h-1 w-10 self-center rounded-full bg-gray-200" />
            {hasHeader && (
              <View className="relative mb-4 flex-row items-center justify-center py-6">
                <Text className="text-body1 text-black">{title}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="absolute right-0"
                  style={{ right: 0 }}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            <View className="flex-1">{children}</View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
