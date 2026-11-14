import { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SlideIndicator } from '~/shared/ui';
import { NoticeData } from '~/entity/notice';
import { CachedImage } from '~/shared/ui/CachedImage';

interface NoticeDetailSlideViewerProps {
  notice: NoticeData;
}

const NoticeDetailSlideViewer = ({ notice }: NoticeDetailSlideViewerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const [current, setCurrent] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // 회전·분할화면으로 폭이 바뀌면 현재 슬라이드 위치를 새 폭에 맞춘다
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: screenWidth * current, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 폭이 바뀔 때만 맞춘다. 페이지 전환은 스크롤이 처리한다
  }, [screenWidth]);

  const handleIndicatorPress = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: screenWidth * index, animated: true });
    setCurrent(index);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setCurrent(Math.round(contentOffsetX / screenWidth));
  };

  return (
    <View className="relative">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}>
        {notice.images.map((image, index) => (
          <CachedImage
            key={index}
            source={{ uri: image.imageUrl }}
            style={{
              width: screenWidth,
              height: 256,
            }}
          />
        ))}
      </ScrollView>

      {notice.images.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0">
          <SlideIndicator
            total={notice.images.length}
            current={current}
            onPress={handleIndicatorPress}
          />
        </View>
      )}
    </View>
  );
};

export default NoticeDetailSlideViewer;
