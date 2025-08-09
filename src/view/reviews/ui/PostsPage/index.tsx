import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, Text, View, ScrollView } from 'react-native';
import { Header } from '~/shared/ui';
import { getReceiveReview, getTossReview } from '../../api/getReviews';
import { ReviewPostType } from '../../model/reviewPostType';
import { ReviewPost } from '~/entity/reviews/ui';

export default function ReviewsPageView() {
  const rawParams = useLocalSearchParams();

  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const active = Array.isArray(rawParams.active) ? rawParams.active[0] : rawParams.active;

  const [posts, setPosts] = useState<ReviewPostType[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await (active === 'receive' ? getReceiveReview(id) : getTossReview());
        if (res.data) {
          setPosts(res.data);
        }
      } catch (error) {
        console.error(error);
        setPosts([]);
      }
    };

    fetch();
  }, [active, id]);

  return (
    <SafeAreaView className="android:pt-10 h-full bg-white">
      <Header headerTitle="게시글" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {posts.length > 0 ? (
          <View className="pb-6">
            {posts.map((post) => (
              <ReviewPost key={post.productId} review={post} />
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-center text-gray-500">표시할 리뷰가 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
