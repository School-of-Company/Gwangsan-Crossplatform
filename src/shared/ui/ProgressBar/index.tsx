import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, PanResponder, LayoutChangeEvent, GestureResponderEvent } from 'react-native';

interface ProgressBarProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const barHeight = 6;
const thumbSize = 28;
const touchAreaHeight = 48;
const barTop = (touchAreaHeight - barHeight) / 2;
const thumbTop = (touchAreaHeight - thumbSize) / 2;
// 썸이 트랙 양 끝에 있을 때도 최소 44pt 터치 영역을 확보한다.
const touchHitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const ProgressBar = ({ value, onChange, min = 0, max = 100, step = 1 }: ProgressBarProps) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<View>(null);
  const onChangeRef = useRef(onChange);
  // 드래그 중 매 이동마다 measure()로 네이티브 브릿지를 왕복하면 반응이 끊기므로
  // 레이아웃이 바뀔 때 한 번만 측정해 캐시한다.
  const sliderLeftRef = useRef(0);
  const sliderWidthRef = useRef(0);

  onChangeRef.current = onChange;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalValue(value);
  }, [value]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    sliderWidthRef.current = width;
    setSliderWidth(width);
    sliderRef.current?.measureInWindow((pageX) => {
      sliderLeftRef.current = pageX;
    });
  }, []);

  const updateValueFromX = useCallback(
    (x: number) => {
      const usableWidth = sliderWidthRef.current - thumbSize;
      if (usableWidth <= 0) return;

      const percentage = Math.max(0, Math.min(1, (x - thumbSize / 2) / usableWidth));
      const rawValue = min + percentage * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      setLocalValue(clampedValue);
      onChangeRef.current(clampedValue);
    },
    [min, max, step]
  );

  const updateValueFromEvent = useCallback(
    (event: GestureResponderEvent) => {
      if (!sliderRef.current) return;
      updateValueFromX(event.nativeEvent.pageX - sliderLeftRef.current);
    },
    [updateValueFromX]
  );

  const panResponder = useMemo(
    () =>
      // 핸들러는 ref에 캐시된 좌표만 읽으므로 렌더마다 재생성하지 않고 한 번만 만든다.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // 부모 ScrollView가 드래그를 가로채 슬라이더가 끊기는 것을 막는다.
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (event) => {
          setIsDragging(true);
          updateValueFromEvent(event);
        },
        onPanResponderMove: (event) => {
          updateValueFromEvent(event);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      }),
    [updateValueFromEvent]
  );

  const thumbPosition = ((localValue - min) / (max - min)) * (sliderWidth - thumbSize);

  return (
    <View className="w-full" onLayout={handleLayout}>
      <Text className="text-label text-black">밝기</Text>
      <View className="relative flex justify-center" style={{ height: touchAreaHeight }}>
        <View
          ref={sliderRef}
          className="absolute left-0 top-0 h-[48px] w-full"
          hitSlop={touchHitSlop}
          {...panResponder.panHandlers}>
          <View
            className="absolute left-0 w-full bg-[#F1F5F9]"
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
            className="absolute border-solid border-sub2-500 bg-white"
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
        {sliderWidth > 0 && isDragging && (
          <View
            testID="progress-bar-value-tooltip"
            pointerEvents="none"
            className="absolute min-w-[32px] items-center justify-center rounded-md bg-gray-900 px-2 py-1"
            style={{
              left: thumbPosition + thumbSize / 2 - 16,
              top: thumbTop - 34,
            }}>
            <Text className="text-xs font-medium text-white">{localValue}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ProgressBar;
