import { useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, PillTabs } from '~/shared/ui';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import { ReviewPost } from '~/entity/reviews/ui';
import { useGetReviews, ReviewsMode } from '../../../../entity/reviews/model/useGetReviews';
import { useGetReceivedReviewsInfinite } from '../../../../entity/reviews/model/useGetReceivedReviewsInfinite';
import { ReviewPostType } from '../../../../entity/reviews/model/reviewPostType';
import { useGetMyInformation } from '~/entity/profile/model/useGetMyInformation';

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

const ERROR_TITLE = '후기를 불러오지 못했습니다.';

// "작성한 후기"(toss)는 이번 서버 페이지네이션 대상이 아니라서 기존 방식(전체 배열,
// 일반 ScrollView)을 그대로 유지한다.
const ReviewsPanel = memo(
  ({
    posts,
    mode,
    isError,
    onRetry,
    width,
    refreshing,
    onRefresh,
  }: {
    posts: ReviewPostType[];
    mode: ReviewsMode;
    isError: boolean;
    onRetry: () => void;
    width: number;
    refreshing: boolean;
    onRefresh: () => void;
  }) => (
    <ScrollView
      testID="toss-reviews-list"
      style={{ width }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {posts.length === 0 && isError ? (
        <ErrorFallback title={ERROR_TITLE} onRetry={onRetry} />
      ) : posts.length > 0 ? (
        <View className="gap-4 px-6 pb-9">
          {posts.map((post) => (
            <ReviewPost key={post.reviewId} review={post} mode={mode} />
          ))}
        </View>
      ) : (
        <Text className="pt-20 text-center text-gray-500">{EMPTY_MESSAGE[mode]}</Text>
      )}
    </ScrollView>
  )
);

// "받은 후기"(receive)는 커서 기반 무한 조회 대상이라 FlatList로 가상화하고,
// 스크롤 끝에서 다음 페이지를 이어붙인다.
const ReceiveReviewsPanel = memo(
  ({
    posts,
    isInitialLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    onEndReached,
    onRetryNextPage,
    onRetry,
    width,
    refreshing,
    onRefresh,
  }: {
    posts: ReviewPostType[];
    isInitialLoading: boolean;
    isError: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError: boolean;
    onEndReached: () => void;
    onRetryNextPage: () => void;
    onRetry: () => void;
    width: number;
    refreshing: boolean;
    onRefresh: () => void;
  }) => {
    if (isInitialLoading) {
      return (
        <View style={{ width }} className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8FC31D" />
        </View>
      );
    }

    return (
      <FlatList
        testID="receive-reviews-list"
        style={{ width }}
        data={posts}
        keyExtractor={(item) => item.reviewId}
        renderItem={({ item }) => <ReviewPost review={item} mode="receive" />}
        ItemSeparatorComponent={() => <View className="h-4" />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 36, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.5}
        onEndReached={hasNextPage && !isFetchingNextPage ? onEndReached : undefined}
        ListEmptyComponent={
          isError ? (
            <ErrorFallback title={ERROR_TITLE} onRetry={onRetry} />
          ) : (
            <Text className="pt-20 text-center text-gray-500">{EMPTY_MESSAGE.receive}</Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View testID="receive-reviews-next-page-loading" className="items-center py-4">
              <ActivityIndicator color="#8FC31D" />
            </View>
          ) : isFetchNextPageError ? (
            <TouchableOpacity
              testID="receive-reviews-retry"
              onPress={onRetryNextPage}
              className="items-center py-4">
              <Text className="text-body5 text-main-500">불러오지 못했어요. 다시 시도</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    );
  }
);

export default function ReviewsPageView({ mode }: ReviewsPageViewProps) {
  const rawParams = useLocalSearchParams();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const [activeMode, setActiveMode] = useState<ReviewsMode>(mode);
  const [refreshing, setRefreshing] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // 활성 탭만 조회하도록, 현재 보고 있지 않은 탭의 쿼리는 비활성화한다.
  // (react-query는 enabled가 꺼져도 이미 받아온 데이터는 캐시에 유지하므로
  // 탭을 다시 전환해도 곧바로 이전 데이터를 다시 보여줄 수 있다.)
  const { data: myInfo } = useGetMyInformation();
  const receiveInfinite = useGetReceivedReviewsInfinite(
    id,
    activeMode === 'receive',
    myInfo?.memberId
  );
  const {
    data: tossPosts = [],
    isError: tossIsError,
    refetch: refetchToss,
  } = useGetReviews('toss', id, {
    enabled: activeMode === 'toss',
  });

  // 페이지 경계에서 동일한 후기가 중복으로 붙는 것을 막기 위해 reviewId 기준으로 한 번 더 걸러낸다.
  const receivePosts = useMemo(() => {
    const seen = new Set<string>();
    const merged: ReviewPostType[] = [];
    receiveInfinite.data?.pages.forEach((page) => {
      page.forEach((review) => {
        if (seen.has(review.reviewId)) return;
        seen.add(review.reviewId);
        merged.push(review);
      });
    });
    return merged;
  }, [receiveInfinite.data]);

  const handleReceiveEndReached = useCallback(() => {
    if (receiveInfinite.hasNextPage && !receiveInfinite.isFetchingNextPage) {
      receiveInfinite.fetchNextPage();
    }
  }, [receiveInfinite]);

  const { refetch: refetchReceive } = receiveInfinite;
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await (activeMode === 'receive' ? refetchReceive() : refetchToss());
    } finally {
      setRefreshing(false);
    }
  }, [activeMode, refetchReceive, refetchToss]);

  const handleTabChange = (nextMode: ReviewsMode) => {
    setActiveMode(nextMode);
    scrollRef.current?.scrollTo({ x: getTabIndex(nextMode) * screenWidth, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    const nextMode = TABS[index]?.value;
    if (nextMode && nextMode !== activeMode) setActiveMode(nextMode);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
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
        contentOffset={{ x: getTabIndex(mode) * screenWidth, y: 0 }}
        onMomentumScrollEnd={handleMomentumScrollEnd}>
        <ReceiveReviewsPanel
          posts={receivePosts}
          isInitialLoading={receiveInfinite.isPending}
          isError={receiveInfinite.isError}
          hasNextPage={Boolean(receiveInfinite.hasNextPage)}
          isFetchingNextPage={receiveInfinite.isFetchingNextPage}
          isFetchNextPageError={receiveInfinite.isFetchNextPageError}
          onEndReached={handleReceiveEndReached}
          onRetryNextPage={() => receiveInfinite.fetchNextPage()}
          onRetry={() => receiveInfinite.refetch()}
          width={screenWidth}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
        <ReviewsPanel
          posts={tossPosts}
          mode="toss"
          isError={tossIsError}
          onRetry={() => refetchToss()}
          width={screenWidth}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
