import { useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '~/shared/ui';
import { TabPager } from '~/shared/ui/TabPager';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import {
  ReviewPost,
  useGetReviews,
  ReviewsMode,
  useGetReceivedReviewsInfinite,
  ReviewPostType,
} from '~/entity/reviews';
import { useGetMyInformation } from '~/entity/profile';
import { usePullToRefresh } from '~/shared/model/usePullToRefresh';
import { Spinner } from '~/shared/ui/Spinner';

interface ReviewsPageViewProps {
  mode: ReviewsMode;
}

const TABS = [
  { value: 'receive' as ReviewsMode, label: '받은 후기' },
  { value: 'toss' as ReviewsMode, label: '작성한 후기' },
];

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
          <Spinner />
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
              <Spinner />
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
  const refetchActive = useCallback(
    () => (activeMode === 'receive' ? refetchReceive() : refetchToss()),
    [activeMode, refetchReceive, refetchToss]
  );
  const { refreshing, onRefresh: handleRefresh } = usePullToRefresh(refetchActive);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle="후기" />
      <TabPager tabs={TABS} value={activeMode} onChange={setActiveMode} testIDPrefix="reviews-tab">
        {(screenWidth) => (
          <>
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
          </>
        )}
      </TabPager>
    </SafeAreaView>
  );
}
