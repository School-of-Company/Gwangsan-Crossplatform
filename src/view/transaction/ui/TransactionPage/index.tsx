import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, Animated } from 'react-native';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { MODE, TYPE } from '~/shared/types/postType';
import { Header } from '~/shared/ui';
import { handleCategory, returnValue } from '../../model/handleCategory';
import { Category } from '../../model/category';
import Post from '~/shared/ui/Post';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionPageView() {
  const { type, mode } = useLocalSearchParams<{ type: TYPE; mode?: MODE }>();

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
  const [refreshing, setRefreshing] = useState(false);
  const currentMode = category ? returnValue(category) : undefined;

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const categories = handleCategory(type as TYPE) ?? [];
  const selectedIndex = categories.indexOf(category);

  const { data = [], refetch } = useGetPosts(
    currentMode as MODE | undefined,
    type as TYPE | undefined
  );

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: selectedIndex,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, slideAnimation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle={type === 'SERVICE' ? '서비스' : '물건'} />
      <View className="bg relative mx-6 mb-6 mt-5 h-[45px] flex-row items-center rounded-[30px] bg-sub2-300 px-2">
        <Animated.View
          className="absolute rounded-[32px] bg-white"
          style={{
            top: 6,
            height: 32,
            width: '47%',
            left: slideAnimation.interpolate({
              inputRange: categories.map((_, index) => index),
              outputRange: categories.map((_, index) => (index === 0 ? '2%' : '55%')),
            }),
          }}
        />

        {categories.map((v, index) => (
          <TouchableOpacity
            key={v}
            onPress={() => setCategory(v as Category)}
            className="absolute items-center justify-center rounded-[32px]"
            style={{
              height: 32,
              width: '47%',
              left: index === 0 ? '2%' : '55%',
            }}>
            <Text className="text-center font-medium">{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {data.map((v) => (
          <Post key={v.id} {...v} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
