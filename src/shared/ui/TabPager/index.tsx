import { ReactNode, RefObject, useRef, useState } from 'react';
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

// contentOffset은 prop이 바뀌면 애니메이션 없이 위치를 옮기므로 처음 마운트할 때 한 번만 잡는다
function PagerScrollView({
  scrollRef,
  initialX,
  onMomentumScrollEnd,
  children,
}: {
  scrollRef: RefObject<ScrollView | null>;
  initialX: number;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  children: ReactNode;
}) {
  const [contentOffset] = useState(() => ({ x: initialX, y: 0 }));
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentOffset={contentOffset}
      onMomentumScrollEnd={onMomentumScrollEnd}>
      {children}
    </ScrollView>
  );
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
        <PagerScrollView
          scrollRef={scrollRef}
          initialX={indexOf(value) * width}
          onMomentumScrollEnd={handleMomentumScrollEnd}>
          {children(width)}
        </PagerScrollView>
      )}
    </>
  );
}
