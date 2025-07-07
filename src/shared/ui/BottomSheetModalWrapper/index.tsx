import React from 'react';
import { View, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';

interface BottomSheetModalWrapperProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheetModalWrapper({
  isVisible,
  onClose,
  title,
  children,
}: BottomSheetModalWrapperProps) {
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = (screenHeight * 2) / 3;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={{ justifyContent: 'flex-end', margin: 0 }}
      backdropOpacity={0.4}
      swipeDirection={['down']}
      onSwipeComplete={onClose}
      propagateSwipe
      useNativeDriver={true}
      hideModalContentWhileAnimating={Platform.OS === 'android'}>
      {isVisible && (
        <View
          className="rounded-t-[20px] bg-white px-6 pb-12 pt-8"
          style={{ minHeight: modalHeight }}>
          <View className="relative mb-6 flex-row items-center justify-center">
            <Text className="flex-1 text-center text-body1">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="닫기">
              <Icon name="close" size={24} color="#8F9094" />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      )}
    </Modal>
  );
}
