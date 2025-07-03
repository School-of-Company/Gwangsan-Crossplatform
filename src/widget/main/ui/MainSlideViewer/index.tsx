import React, { useRef, useEffect } from 'react';
import { View, Image, Dimensions, ScrollView } from 'react-native';

import image1 from '@/shared/assets/png/mainSlides/slide1.png';
import image2 from '@/shared/assets/png/mainSlides/slide2.png';
import image3 from '@/shared/assets/png/mainSlides/slide3.png';
import image4 from '@/shared/assets/png/mainSlides/slide4.png';
import image5 from '@/shared/assets/png/mainSlides/slide5.png';
import image6 from '@/shared/assets/png/mainSlides/slide6.png';

const images = [image1, image2, image3, image4, image5, image6];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MainSlideViewer = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let current = 0;
    intervalRef.current = setInterval(() => {
      current = (current + 1) % images.length;
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * current, animated: true });
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <View className="flex flex-col items-center justify-center gap-2 border-b border-b-gray-400 py-6">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}>
        {images.map((img, idx) => (
          <Image
            key={idx}
            source={img}
            style={{
              width: SCREEN_WIDTH,
              height: 210,
              resizeMode: 'contain',
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default MainSlideViewer;
