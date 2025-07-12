import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
  const { type } = useLocalSearchParams<{ type: TYPE }>();
  const [category, setCategory] = useState<Category>();
  const mode = category ? returnValue(category) : undefined;
  const router = useRouter();

  const { data = [] } = useGetPosts(mode as MODE | undefined, type as TYPE | undefined);

  const handlePress = useCallback(() => {
    if (!type || !mode) return;

    const targetRoute = ROUTE_MAP[type as TYPE]?.[mode as MODE];
    if (targetRoute) {
      router.push(targetRoute);
    }
  }, [router, type, mode]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle={type === 'SERVICE' ? '서비스' : '물건'} />
      <View className="bg mx-6 mb-6 mt-5 h-[45px] flex-row items-center justify-between rounded-[30px] bg-sub2-300 px-2">
        {(handleCategory(type as TYPE) ?? []).map((v) => {
          return (
            <Text
              key={v}
              onPress={() => setCategory(v as Category)}
              className={`rounded-[32px] px-[15%] py-[6px] ${
                category === v ? 'bg-white' : 'bg-transparent'
              }`}>
              {v}
            </Text>
          );
        })}
      </View>
      <ScrollView>
        {data.map((v) => {
          return <Post key={v.id} {...v} />;
        })}
      </ScrollView>
      {type && mode && (
        <TouchableOpacity 
          className="absolute bottom-10 right-10 w-[60px] h-[60px] z-50"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          onPress={handlePress}
        >
          <Ionicons
            name="add-circle"
            size={60}
            color="#8FC31D"
          />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
