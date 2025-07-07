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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleIndicatorPress = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
    setCurrentImageIndex(index);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentImageIndex(newIndex);
  };

  return (
    <View className="relative">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {notice.images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image.imageUrl }}
            style={{
              width: SCREEN_WIDTH,
              height: 256, // h-64 equivalent
            }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {notice.images.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0">
          <SlideIndicator
            total={notice.images.length}
            current={currentImageIndex}
            onPress={handleIndicatorPress}
          />
        </View>
      )}
    </View>
  );
};

export default NoticeDetailSlideViewer;