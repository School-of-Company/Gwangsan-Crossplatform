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
  variant?: 'primary' | 'secondary' | 'error';
  width?: string;
}

const BUTTON_HEIGHT = 52;
const PRESS_SHRINK = 3;

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
  const shrink = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      Animated.timing(shrink, {
        toValue: PRESS_SHRINK,
        duration: 100,
        useNativeDriver: false,
      }).start();
      onPressIn?.(e);
    },
    [shrink, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      Animated.timing(shrink, { toValue: 0, duration: 100, useNativeDriver: false }).start();
      onPressOut?.(e);
    },
    [shrink, onPressOut]
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
        className={`
          items-center justify-center rounded-xl px-8 py-3
          ${
            disabled
              ? variant === 'primary'
                ? 'bg-[#CDCDCF]'
                : variant === 'secondary'
                  ? 'border-2 border-[#CDCDCF] bg-white'
                  : 'bg-[#CDCDCF]'
              : variant === 'primary'
                ? 'bg-main-500'
                : variant === 'secondary'
                  ? 'border-2 border-main-500 bg-white'
                  : 'bg-error-500'
          }
        `}
        style={{
          height: Animated.subtract(BUTTON_HEIGHT, shrink),
          marginHorizontal: Animated.divide(shrink, 2),
        }}>
        <Text
          className={`
          text-lg font-semibold
          ${
            disabled
              ? 'text-gray-500'
              : variant === 'primary'
                ? 'text-white'
                : variant === 'secondary'
                  ? 'text-main-500'
                  : 'text-white'
          }
        `}>
          {children}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};
