import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { Dropdown, Header } from '~/shared/ui';
import { Category } from '~/view/transaction/model/category';
import { returnValue } from '~/view/transaction/model/handleCategory';
import PostList from '~/widget/post/ui/PostList';

export default function PostsPageView() {
  const [firstValue, setFirstValue] = useState<'물건' | '서비스'>();
  const [secondValue, setSecondValue] = useState<Category>();
  const R = useRouter();
  const { data } = useGetPosts(
    returnValue(secondValue) ?? undefined,
    firstValue === '물건' ? 'OBJECT' : 'SERVICE'
  );

  const handlePress = useCallback(() => {
    R.push('/need');
  }, [R]);
  return (
    <SafeAreaView className="android:pt-10 h-full bg-white">
      <Header headerTitle="게시글" />
      <View className="mb-6 mt-6 px-6">
        <Text className="mb-4 text-titleSmall">카테고리 선택 후 거래내역 확인</Text>
        <View className="mt-4 flex-row items-center justify-between gap-2">
          <Dropdown
            onSelect={(e) => setFirstValue(e)}
            items={['물건', '서비스']}
            placeholder="선택"
            width="w-[45%]"
          />
          <Dropdown
            onSelect={(e) => setSecondValue(e as Category)}
            items={firstValue === '서비스' ? ['할수있어요', '해주세요'] : ['팔아요', '필요해요']}
            placeholder="선택"
            width="w-[45%]"
          />
        </View>
      </View>
      <PostList posts={data} />
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
