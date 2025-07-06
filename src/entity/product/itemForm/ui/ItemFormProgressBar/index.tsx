import { View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface ItemFormProgressBarProps {
  step: number;
}

const ItemFormProgressBar = ({ step }: ItemFormProgressBarProps) => {
  const animatedValue = useRef(new Animated.Value(step)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: step,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, animatedValue]);

  return (
    <View>
      <View className="h-2 w-full flex-row">
        <Animated.View
          className="bg-blue-300"
          style={{
            flex: animatedValue,
          }}
        />
        <Animated.View
          className="bg-gray-100"
          style={{
            flex: animatedValue.interpolate({
              inputRange: [1, 2, 3],
              outputRange: [2, 1, 0],
            }),
          }}
        />
      </View>
    </View>
  );
};

export default ItemFormProgressBar;
