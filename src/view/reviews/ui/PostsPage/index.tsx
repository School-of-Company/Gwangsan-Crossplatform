import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, Text, View, ScrollView } from 'react-native';
import { Dropdown, Header } from '~/shared/ui';
import { Category } from '~/view/transaction/model/category';
import { returnValue } from '~/view/transaction/model/handleCategory';
import { getReceiveReview, getTossReview } from '../../api/getReviews';
import { ReviewPostType } from '../../model/reviewPostType';
import { ReviewPost } from '~/entity/reviews/ui';

export default function ReviewsPageView() {
  const rawParams = useLocalSearchParams();

  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const active = Array.isArray(rawParams.active) ? rawParams.active[0] : rawParams.active;

  const [firstValue, setFirstValue] = useState<'물건' | '서비스'>();
  const [secondValue, setSecondValue] = useState<Category>();
  const [posts, setPosts] = useState<ReviewPostType[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (!firstValue || !secondValue || !id) return;

      const mode = returnValue(secondValue);
      const type = firstValue === '물건' ? 'OBJECT' : 'SERVICE';

      try {
        const res = await (active === 'receive'
          ? getReceiveReview(id, mode, type)
          : getTossReview(mode, type));
        if (res.data) {
          setPosts(res.data);
        }
      } catch (error) {
        console.error(error);
        setPosts([]);
      }
    };

    fetch();
  }, [active, firstValue, secondValue, id]);

  return (
    <SafeAreaView className="android:pt-10 h-full bg-white">
      <Header headerTitle="게시글" />
      <View className="mb-6 mt-6 px-6">
        <Text className="mb-4 text-titleSmall">카테고리 선택 후 거래내역 확인</Text>
        <View className="mt-4 flex-row items-center justify-between gap-2">
          <Dropdown
            onSelect={(e) => setFirstValue(e as '물건' | '서비스')}
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {posts.length > 0 ? (
          <View className="pb-6">
            {posts.map((post) => (
              <ReviewPost key={post.productId} review={post} />
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-center text-gray-500">
              {!firstValue || !secondValue ? '카테고리를 선택해주세요.' : '표시할 리뷰가 없습니다.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
