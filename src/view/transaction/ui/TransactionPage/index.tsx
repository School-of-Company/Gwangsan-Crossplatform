import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { TYPE } from '~/shared/types/postType';
import { Header } from '~/shared/ui';
import { handleCategory, returnValue } from '../../model/handleCategory';
import { Category } from '../../model/category';
import Post from '~/shared/ui/Post';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function TransactionPageView() {
  const { type } = useLocalSearchParams<{ type: TYPE }>();
  const [category, setCategory] = useState<Category>();
  const mode = category ? returnValue(category) : undefined;
  const R = useRouter();
  const { data } = useGetPosts(mode!, type);

  const handlePress = useCallback(() => {
    R.push('/need');
  }, [R]);
  return (
    <SafeAreaView className="android:pt-10 h-full bg-white">
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
        {data?.map((v) => {
          return <Post key={v.id} {...v} />;
        })}
      </ScrollView>
      <TouchableOpacity onPress={handlePress}>
        <Ionicons
          name="add-circle"
          size={60}
          color="#8FC31D"
          className="absolute bottom-10 right-10"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
