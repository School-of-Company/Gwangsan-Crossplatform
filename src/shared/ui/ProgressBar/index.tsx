import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, PanResponder } from 'react-native';

interface ProgressBarProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const ProgressBar = ({ value, onChange, min = 0, max = 100, step = 1 }: ProgressBarProps) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<View>(null);
  const onChangeRef = useRef(onChange);
  const barHeight = 6;
  const thumbSize = 24;
  const touchAreaHeight = 48;
  const barTop = (touchAreaHeight - barHeight) / 2;
  const thumbTop = (touchAreaHeight - thumbSize) / 2;

  onChangeRef.current = onChange;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const updateValueFromX = useCallback((x: number) => {
    const usableWidth = sliderWidth - thumbSize;
    const percentage = Math.max(0, Math.min(1, (x - thumbSize / 2) / usableWidth));
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    setLocalValue(clampedValue);
  }, [sliderWidth, min, max, step]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (sliderRef.current) {
        sliderRef.current.measure((pageX, pageY) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          updateValueFromX(touchX);
        });
      }
    },
    onPanResponderMove: (evt) => {
      if (sliderRef.current) {
        sliderRef.current.measure((pageX) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          updateValueFromX(touchX);
        });
      }
    },
  });

  const thumbPosition = (localValue - min) / (max - min) * (sliderWidth - thumbSize);

  return (
    <View className="w-full" onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}>
      <Text className="text-label text-black">밝기</Text>
      <View className="relative flex justify-center" style={{ height: touchAreaHeight }}>
        <View className="absolute left-0 top-0 h-full w-full" />
        <View
          ref={sliderRef}
          className="absolute left-0 top-0 h-[48px] w-full"
          {...panResponder.panHandlers}>
          <View
            className="bg- absolute left-0 w-full bg-[#F1F5F9]"
            style={{
              top: barTop,
              height: barHeight,
              borderRadius: 3,
            }}
          />
          <View
            className="absolute left-0 rounded bg-sub2-500"
            style={{
              top: barTop,
              height: barHeight,
              width: thumbPosition + thumbSize / 2,
            }}
          />
        </View>
        {sliderWidth > 0 && (
          <View
            className="bg-whie absolute border-solid border-sub2-500 bg-white"
            style={{
              left: thumbPosition,
              top: thumbTop,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              borderWidth: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              pointerEvents: 'none',
            }}
          />
        )}
      </View>
    </View>
  );
};

export default ProgressBar;
