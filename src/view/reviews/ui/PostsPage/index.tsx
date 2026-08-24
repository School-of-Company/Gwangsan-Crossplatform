import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, PillTabs } from '~/shared/ui';
import { ReviewPost } from '~/entity/reviews/ui';
import { useGetReviews, ReviewsMode } from '../../model/useGetReviews';

interface ReviewsPageViewProps {
  mode: ReviewsMode;
}

const TABS = [
  { value: 'receive' as ReviewsMode, label: '받은 후기' },
  { value: 'toss' as ReviewsMode, label: '작성한 후기' },
];

export default function ReviewsPageView({ mode }: ReviewsPageViewProps) {
  const rawParams = useLocalSearchParams();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const [activeMode, setActiveMode] = useState<ReviewsMode>(mode);

  const { data: posts = [], isError } = useGetReviews(activeMode, id);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="후기" />
      <PillTabs
        tabs={TABS}
        value={activeMode}
        onChange={setActiveMode}
        testIDPrefix="reviews-tab"
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {posts.length > 0 ? (
          <View className="pb-6">
            {posts.map((post) => (
              <ReviewPost key={post.reviewId} review={post} mode={activeMode} />
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
