import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View, Animated, LayoutChangeEvent } from 'react-native';
import { Header } from '~/shared/ui';
import { handleCategory } from '../../model/handleCategory';
import { Category } from '../../model/category';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModeType } from '~/shared/types/mode';
import { ProductType } from '~/shared/types/type';
import PostList from '~/widget/post/ui/PostList';

export default function PostView() {
  const { type, mode } = useLocalSearchParams<{ type: ProductType; mode?: ModeType }>();

  const getInitialCategory = (): Category => {
    if (mode) {
      if (type === 'OBJECT') {
        return mode === 'GIVER' ? '팔아요' : '필요해요';
      } else {
        return mode === 'GIVER' ? '할 수 있어요' : '해주세요';
      }
    }
    return type === 'OBJECT' ? '팔아요' : '할 수 있어요';
  };

  const [category, setCategory] = useState<Category>(getInitialCategory());

  const [containerWidth, setContainerWidth] = useState(0);
  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const categories = handleCategory(type as ProductType) ?? [];
  const selectedIndex = categories.indexOf(category);

  const segments = Math.max(categories.length, 1);
  const segmentWidth = containerWidth / segments;
  const translateX = slideAnimation.interpolate({
    inputRange: [0, Math.max(segments - 1, 1)],
    outputRange: [0, Math.max(segments - 1, 1) * segmentWidth],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: selectedIndex,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, slideAnimation]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle={type === 'SERVICE' ? '서비스' : '물건'} />
      <View
        onLayout={handleLayout}
        className="bg relative mx-6 mb-6 mt-5 h-[45px] flex-row items-center rounded-[30px] bg-sub2-300 px-2">
        <Animated.View
          className="absolute top-[6px] h-8 rounded-[32px] bg-white"
          style={{
            width: segmentWidth * 0.94,
            transform: [{ translateX }],
            marginLeft: segmentWidth * 0.03,
            marginRight: segmentWidth * 0.03,
          }}
        />

        {categories.map((v, index) => (
          <TouchableOpacity
            key={v}
            onPress={() => setCategory(v as Category)}
            className="absolute h-8 w-[47%] items-center justify-center rounded-[32px]"
            style={{
              left: index === 0 ? '2%' : '55%',
            }}>
            <Text className="text-center font-medium">{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PostList category={category} />
    </SafeAreaView>
  );
}
