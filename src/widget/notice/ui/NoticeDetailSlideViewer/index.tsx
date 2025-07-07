import { useRef, useState } from 'react';
import {
  View,
  Image,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SlideIndicator } from '@/shared/ui';
import { NoticeData } from '@/entity/notice/model/noticeData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NoticeDetailSlideViewerProps {
  notice: NoticeData;
}

const NoticeDetailSlideViewer = ({ notice }: NoticeDetailSlideViewerProps) => {
  const [current, setCurrent] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleIndicatorPress = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
    setCurrent(index);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setCurrent(Math.round(contentOffsetX / SCREEN_WIDTH));
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
          <Image
            key={index}
            source={{ uri: image.imageUrl }}
            style={{
              width: SCREEN_WIDTH,
              height: 256,
            }}
            resizeMode="cover"
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
