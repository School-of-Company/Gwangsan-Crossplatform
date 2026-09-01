import { useLocalSearchParams } from 'expo-router';
import { memo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, PillTabs } from '~/shared/ui';
import { ReviewPost } from '~/entity/reviews/ui';
import { useGetReviews, ReviewsMode } from '../../model/useGetReviews';
import { ReviewPostType } from '../../model/reviewPostType';

interface ReviewsPageViewProps {
  mode: ReviewsMode;
}

const TABS = [
  { value: 'receive' as ReviewsMode, label: '받은 후기' },
  { value: 'toss' as ReviewsMode, label: '작성한 후기' },
];

const getTabIndex = (mode: ReviewsMode) => TABS.findIndex((t) => t.value === mode);

const EMPTY_MESSAGE: Record<ReviewsMode, string> = {
  receive: '받은 후기가 없습니다.',
  toss: '작성한 후기가 없습니다.',
};

const ERROR_MESSAGE = '후기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ReviewsPanel = memo(
  ({ posts, mode, isError }: { posts: ReviewPostType[]; mode: ReviewsMode; isError: boolean }) => (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      {posts.length > 0 ? (
        <View className="gap-4 px-6 pb-9">
          {posts.map((post) => (
            <ReviewPost key={post.reviewId} review={post} mode={mode} />
          ))}
        </View>
      ) : (
        <Text className="pt-20 text-center text-gray-500">
          {isError ? ERROR_MESSAGE : EMPTY_MESSAGE[mode]}
        </Text>
      )}
    </ScrollView>
  )
);

export default function ReviewsPageView({ mode }: ReviewsPageViewProps) {
  const rawParams = useLocalSearchParams();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const [activeMode, setActiveMode] = useState<ReviewsMode>(mode);
  const scrollRef = useRef<ScrollView>(null);

  const { data: receivePosts = [], isError: receiveIsError } = useGetReviews('receive', id);
  const { data: tossPosts = [], isError: tossIsError } = useGetReviews('toss', id);

  const handleTabChange = (nextMode: ReviewsMode) => {
    setActiveMode(nextMode);
    scrollRef.current?.scrollTo({ x: getTabIndex(nextMode) * SCREEN_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const nextMode = TABS[index]?.value;
    if (nextMode && nextMode !== activeMode) setActiveMode(nextMode);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="후기" />
      <PillTabs
        tabs={TABS}
        value={activeMode}
        onChange={handleTabChange}
        containerClassName="mx-6 mb-3 mt-3"
        testIDPrefix="reviews-tab"
      />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: getTabIndex(mode) * SCREEN_WIDTH, y: 0 }}
        onMomentumScrollEnd={handleMomentumScrollEnd}>
        <ReviewsPanel posts={receivePosts} mode="receive" isError={receiveIsError} />
        <ReviewsPanel posts={tossPosts} mode="toss" isError={tossIsError} />
      </ScrollView>
    </SafeAreaView>
  );
}
