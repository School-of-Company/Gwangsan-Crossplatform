import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { useRef, useCallback } from 'react';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'error' | 'neutral';
  width?: string;
}

export const Button = ({
  children,
  disabled = false,
  variant = 'primary',
  style,
  width = 'w-full',
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    },
    [scale, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
      onPressOut?.(e);
    },
    [scale, onPressOut]
  );

  return (
    <TouchableOpacity
      className={`h-[52px] ${width} justify-center bg-white`}
      disabled={disabled}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      {...props}>
      <Animated.View
        className={`h-full items-center justify-center rounded-xl px-8 py-3 ${
          disabled
            ? variant === 'primary'
              ? 'bg-[#CDCDCF]'
              : variant === 'secondary'
                ? 'border-2 border-[#CDCDCF] bg-white'
                : variant === 'neutral'
                  ? 'bg-[#CDCDCF]'
                  : 'bg-[#CDCDCF]'
            : variant === 'primary'
              ? 'bg-main-500'
              : variant === 'secondary'
                ? 'border-2 border-main-500 bg-white'
                : variant === 'neutral'
                  ? 'bg-[#F3F4F5]'
                  : 'bg-error-500'
        } `}
        style={{
          transform: [{ scale }],
        }}>
        <Text
          className={`text-lg font-semibold ${
            disabled
              ? 'text-gray-500'
              : variant === 'primary'
                ? 'text-white'
                : variant === 'secondary'
                  ? 'text-main-500'
                  : variant === 'neutral'
                    ? 'text-gray-900'
                    : 'text-white'
          } `}>
          {children}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};
