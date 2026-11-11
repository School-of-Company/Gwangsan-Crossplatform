import { ReactNode, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { PillTabs, PillTabOption } from '../PillTabs';

interface TabPagerProps<T extends string> {
  tabs: PillTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testIDPrefix?: string;
  // 있으면 탭은 그대로 두고 페이저 자리에만 대신 그린다 (로딩/에러 화면)
  fallback?: ReactNode;
  children: (width: number) => ReactNode;
}

export function TabPager<T extends string>({
  tabs,
  value,
  onChange,
  testIDPrefix,
  fallback,
  children,
}: TabPagerProps<T>) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const indexOf = (tab: T) => tabs.findIndex((t) => t.value === tab);

  const handleTabChange = (tab: T) => {
    onChange(tab);
    scrollRef.current?.scrollTo({ x: indexOf(tab) * width, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const tab = tabs[Math.round(event.nativeEvent.contentOffset.x / width)]?.value;
    if (tab && tab !== value) onChange(tab);
  };

  return (
    <>
      <PillTabs
        tabs={tabs}
        value={value}
        onChange={handleTabChange}
        containerClassName="mx-6 mb-3 mt-3"
        testIDPrefix={testIDPrefix}
      />
      {fallback ?? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          // 페이저가 늦게 마운트돼도 현재 탭 위치에서 시작한다
          contentOffset={{ x: indexOf(value) * width, y: 0 }}
          onMomentumScrollEnd={handleMomentumScrollEnd}>
          {children(width)}
        </ScrollView>
      )}
    </>
  );
}
