import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';

export interface PillTabOption<T extends string> {
  value: T;
  label: string;
}

interface PillTabsProps<T extends string> {
  tabs: PillTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  containerClassName?: string;
  padding?: number;
  testIDPrefix?: string;
}

const ACTIVE_TEXT_CLASSNAME = 'text-body4 font-semibold text-white';
const INACTIVE_TEXT_CLASSNAME = 'text-body4 text-gray-500';

export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  containerClassName = 'mx-6 mb-3',
  padding = 4,
  testIDPrefix = 'pill-tab',
}: PillTabsProps<T>) {
  const [tabWidth, setTabWidth] = useState(0);
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.value === value),
    0
  );
  const thumbPosition = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.timing(thumbPosition, {
      toValue: activeIndex,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, thumbPosition]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTabWidth((event.nativeEvent.layout.width - padding * 2) / tabs.length);
  };

  return (
    <View
      onLayout={handleLayout}
      className={`relative flex-row rounded-full bg-gray-100 p-1 ${containerClassName}`}>
      {tabWidth > 0 && (
        <Animated.View
          className="absolute rounded-full bg-gray-900"
          style={{
            top: padding,
            bottom: padding,
            left: padding,
            width: tabWidth,
            transform: [
              {
                translateX: thumbPosition.interpolate({
                  inputRange: [0, Math.max(tabs.length - 1, 1)],
                  outputRange: [0, tabWidth * Math.max(tabs.length - 1, 1)],
                }),
              },
            ],
          }}
        />
      )}
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          testID={`${testIDPrefix}-${tab.value}`}
          onPress={() => onChange(tab.value)}
          className="flex-1 items-center rounded-full py-2">
          <Text className={tab.value === value ? ACTIVE_TEXT_CLASSNAME : INACTIVE_TEXT_CLASSNAME}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
