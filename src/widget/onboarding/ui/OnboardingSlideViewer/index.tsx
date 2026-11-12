import { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import onboardingSlide1 from '~/shared/assets/png/startSlide/onboardingSlide1.png';
import onboardingSlide2 from '~/shared/assets/png/startSlide/onboardingSlide2.png';
import onboardingSlide3 from '~/shared/assets/png/startSlide/onboardingSlide3.png';
import { SlideIndicator } from '~/shared/ui';

const images = [onboardingSlide1, onboardingSlide2, onboardingSlide3];

const OnboardingSlideViewer = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [current, setCurrent] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // 회전·분할화면으로 폭이 바뀌면 현재 슬라이드 위치를 새 폭에 맞춘다
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: screenWidth * current, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 폭이 바뀔 때만 맞춘다. 페이지 전환은 스크롤이 처리한다
  }, [screenWidth]);

  const handleDotPress = (idx: number) => {
    scrollViewRef.current?.scrollTo({ x: screenWidth * idx, animated: true });
    setCurrent(idx);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    setCurrent(newIndex);
  };

  return (
    <View className="flex flex-col items-center gap-3">
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
              width: screenWidth,
              height: screenHeight * 0.65,
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
