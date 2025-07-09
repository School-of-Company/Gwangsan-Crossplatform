import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { TYPE } from '~/shared/types/postType';
import { Header } from '~/shared/ui';
import { handleCategory, returnValue } from '../../model/handleCategory';
import { Category } from '../../model/category';
import Post from '~/shared/ui/Post';

export default function TransactionPageView() {
  const { type } = useLocalSearchParams<{ type: TYPE }>();
  const [category, setCategory] = useState<Category>();
  const mode = category ? returnValue(category) : undefined;
  const { data } = useGetPosts(mode!, type);

  return (
    <SafeAreaView className="android:pt-10 h-full bg-white">
      <Header headerTitle="서비스" />
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
        {data?.map((v) => {
          return <Post key={v.id} {...v} />;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
