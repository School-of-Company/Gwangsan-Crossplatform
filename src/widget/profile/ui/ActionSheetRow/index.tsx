import { useCallback, useRef } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';

interface ActionSheetRowProps {
  label: string;
  labelClassName?: string;
  disabled?: boolean;
  onPress?: () => void;
}

// 카드 우측 점 3개 메뉴(수정/삭제/닫기) 버튼 한 줄. 눌렀을 때 살짝 작아지는 효과를 준다.
export const ActionSheetRow = ({
  label,
  labelClassName = 'text-gray-900',
  disabled = false,
  onPress,
}: ActionSheetRowProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={disabled ? 'opacity-50' : ''}>
      <Animated.View
        className="h-[56px] items-center justify-center"
        style={{ transform: [{ scale }] }}>
        <Text className={`text-lg font-medium ${labelClassName}`}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};
