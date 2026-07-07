import { useLocalSearchParams } from 'expo-router';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '~/shared/ui';
import { ReviewPost } from '~/entity/reviews/ui';
import { useGetReviews, ReviewsMode } from '../../model/useGetReviews';

interface ReviewsPageViewProps {
  mode: ReviewsMode;
}

export default function ReviewsPageView({ mode }: ReviewsPageViewProps) {
  const rawParams = useLocalSearchParams();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;

  const { data: posts = [], isError } = useGetReviews(mode, id);

  return (
    <SafeAreaView className="android:pt-10 h-full bg-white" edges={['top', 'left', 'right']}>
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
            <Text className="text-center text-gray-500">
              {isError
                ? '후기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
                : '표시할 리뷰가 없습니다.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
