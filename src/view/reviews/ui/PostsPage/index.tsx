import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { Dropdown, Header } from '~/shared/ui';
import { Category } from '~/view/transaction/model/category';
import { returnValue } from '~/view/transaction/model/handleCategory';
import PostList from '~/widget/post/ui/PostList';

export default function PostsPageView() {
  const { active } = useLocalSearchParams();
  const [firstValue, setFirstValue] = useState<'물건' | '서비스'>();
  const [secondValue, setSecondValue] = useState<Category>();
  const [posts, setPosts] = useState([]);

  (returnValue(secondValue) ?? undefined, firstValue === '물건' ? 'OBJECT' : 'SERVICE');
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
      <PostList />
    </SafeAreaView>
  );
}
