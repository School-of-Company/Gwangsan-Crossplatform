import { useRef, useState } from 'react';
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
