import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
  Animated,
  Easing,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface BottomSheetModalWrapperProps {
  isVisible: boolean;
  onClose: () => void;
  onAnimationComplete?: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheetModalWrapper({
  isVisible,
  onClose,
  onAnimationComplete,
  title,
  children,
}: BottomSheetModalWrapperProps) {
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = (screenHeight * 2) / 3;

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
    if (isVisible) {
      translateY.setValue(modalHeight);
      overlayOpacity.setValue(0);
      setShow(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start();
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        delay: 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else if (show) {
      Animated.timing(translateY, {
        toValue: modalHeight,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start(() => {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 120,
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
      }}>
      <Pressable
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
        onPress={onClose}>
        <Animated.View
          style={{
            height: modalHeight,
            backgroundColor: 'white',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            transform: [{ translateY }],
          }}>
          <Pressable
            style={{
              flex: 1,
              padding: 16,
            }}
            onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>{children}</View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
