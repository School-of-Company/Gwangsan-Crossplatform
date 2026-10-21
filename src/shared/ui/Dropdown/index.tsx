import Icon from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { brandColors, useThemeColors } from '@/shared/lib/theme';

interface DropdownProps<T extends string> {
  label?: string;
  items: { value: T; label: string }[];
  placeholder?: string;
  selectedItem?: T;
  width?: string;
  onSelect?: (item: T) => void;
}

const MENU_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
};

export function Dropdown<T extends string>(props: DropdownProps<T>) {
  const { label, items, placeholder, selectedItem, onSelect, width = 'full' } = props;
  const colors = useThemeColors();
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<T | null>(selectedItem || null);
  const [progress] = useState(() => new Animated.Value(0));

  // selectedItem을 넘기면(값이 undefined여도) 부모 값을 그대로 보여준다. 내부 상태를 우선하면
  // 부모가 선택을 되돌려도(예: 지점 변경 실패) 화면엔 마지막으로 누른 항목이 남았다.
  const isControlled = 'selectedItem' in props;
  const current = isControlled ? selectedItem : (selected ?? selectedItem);
  const selectedLabel = current ? items.find((item) => item.value === current)?.label : undefined;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: show ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [show, progress]);

  const chevronRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const menuTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  const handleSelect = (value: T) => {
    setSelected(value);
    onSelect?.(value);
    setShow(false);
  };

  return (
    // 열린 동안만 위로 띄운다. zIndex만으로는 안드로이드에서 뒤 요소에 가려질 수 있어
    // elevation도 함께 올린다.
    <View
      className={`${width} relative flex gap-2`}
      style={{ zIndex: show ? 50 : 0, elevation: show ? 50 : 0 }}>
      {label && <Text className="text-label text-foreground">{label}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: show }}
        className={`h-[56px] flex-row items-center justify-between rounded-xl border bg-background px-4 ${show ? 'border-main-500' : 'border-gray-300'}`}
        onPress={() => setShow((prev) => !prev)}>
        <Text
          numberOfLines={1}
          className={`flex-1 text-body5 ${selectedLabel ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
          {selectedLabel || placeholder || '선택해주세요'}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Icon
            name="chevron-down"
            size={18}
            color={show ? brandColors.main : colors['gray-500']}
          />
        </Animated.View>
      </Pressable>
      {show && (
        <Animated.View
          // overflow-hidden을 주면 iOS에서 그림자까지 잘려 보이지 않는다.
          className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-surface"
          style={[
            MENU_SHADOW,
            { elevation: 50, opacity: progress, transform: [{ translateY: menuTranslateY }] },
          ]}>
          <ScrollView
            style={{ maxHeight: 240 }}
            contentContainerStyle={{ padding: 6 }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const isSelected = item.value === current;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isSelected }}
                  className={`flex-row items-center justify-between rounded-xl px-3 py-3.5 ${isSelected ? 'bg-main-500/10' : 'active:bg-gray-100'}`}
                  onPress={() => handleSelect(item.value)}>
                  <Text
                    className={`text-body5 ${isSelected ? 'font-semibold text-main-600' : 'text-gray-900'}`}>
                    {item.label}
                  </Text>
                  {isSelected && <Icon name="checkmark" size={18} color={brandColors.main} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
