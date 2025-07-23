import { useRef, useState } from 'react';
import {
  View,
  Image,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import onboardingSlide1 from '~/shared/assets/png/startSlide/onboardingSlide1.png';
import onboardingSlide2 from '~/shared/assets/png/startSlide/onboardingSlide2.png';
import onboardingSlide3 from '~/shared/assets/png/startSlide/onboardingSlide3.png';
import { SlideIndicator } from '@/shared/ui';

const images = [onboardingSlide1, onboardingSlide2, onboardingSlide3];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const OnboardingSlideViewer = () => {
  const [current, setCurrent] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleDotPress = (idx: number) => {
    scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * idx, animated: true });
    setCurrent(idx);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrent(newIndex);
  };

  return (
    <View className="flex flex-col items-center gap-3 ">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}>
        {images.map((img, idx) => (
          <Image
            key={idx}
            source={img}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT * 0.65,
              resizeMode: 'contain',
            }}
          />
        ))}
      </ScrollView>
      <SlideIndicator total={images.length} current={current} onPress={handleDotPress} />
    </View>
  );
};

export default OnboardingSlideViewer;
