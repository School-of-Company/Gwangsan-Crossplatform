import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { Dropdown, Header } from '~/shared/ui';
import { Category } from '~/view/transaction/model/category';
import { returnValue } from '~/view/transaction/model/handleCategory';
import { getReceiveReview, getTossReview } from '../../api/getReviews';
import { ReviewPostType } from '../../model/reviewPostType';
import { ReviewPost } from '~/entity/reviews/ui';

export default function ReviewsPageView() {
  const params = useLocalSearchParams<{ id: string; active: string }>();
  const { active, id } = params;

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

      <View className="flex-1">
        {posts.length > 0 ? (
          <View>
            {posts.map((v) => (
              <ReviewPost key={v.productId} review={v} />
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">표시할 리뷰가 없습니다.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
