import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, Animated } from 'react-native';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { MODE, TYPE } from '~/shared/types/postType';
import { Header } from '~/shared/ui';
import { handleCategory, returnValue } from '../../model/handleCategory';
import { Category } from '../../model/category';
import Post from '~/shared/ui/Post';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROUTE_MAP: Record<TYPE, Record<MODE, string>> = {
  SERVICE: {
    RECEIVER: '/request',
    GIVER: '/offer',
  },
  OBJECT: {
    RECEIVER: '/need',
    GIVER: '/sell',
  },
};

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
  const router = useRouter();
  
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

  const handlePress = useCallback(() => {
    if (!type || !currentMode) return;
    const targetRoute = ROUTE_MAP[type as TYPE]?.[currentMode as MODE];
    if (targetRoute) {
      router.push(targetRoute);
    }
  }, [router, type, currentMode]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle={type === 'SERVICE' ? '서비스' : '물건'} />
      <View className="bg mx-6 mb-6 mt-5 h-[45px] flex-row items-center rounded-[30px] bg-sub2-300 px-2 relative">
        <Animated.View
          className="absolute rounded-[32px] bg-white"
          style={{
            top: 6,
            height: 32,
            width: '47%',
            left: slideAnimation.interpolate({
              inputRange: categories.map((_, index) => index),
              outputRange: categories.map((_, index) => index === 0 ? '2%' : '55%'),
            }),
          }}
        />
        
        {categories.map((v, index) => (
          <TouchableOpacity
            key={v}
            onPress={() => setCategory(v as Category)}
            className="absolute rounded-[32px] items-center justify-center"
            style={{ 
              height: 32,
              width: '47%',
              left: index === 0 ? '2%' : '55%'
            }}>
            <Text className="text-center font-medium">
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {data.map((v) => (
          <Post key={v.id} {...v} />
        ))}
      </ScrollView>
      {type && currentMode && (
        <TouchableOpacity
          className="absolute bottom-10 right-10 z-50 h-[60px] w-[60px]"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          onPress={handlePress}>
          <Ionicons name="add-circle" size={60} color="#8FC31D" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
