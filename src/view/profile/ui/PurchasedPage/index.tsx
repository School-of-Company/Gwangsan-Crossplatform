import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { PostThumbnail } from '~/shared/ui/PostThumbnail';
import { acquireNavigationLock } from '~/shared/lib/navigationGuard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '~/shared/ui';
import { TabPager } from '~/shared/ui/TabPager';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import { MODE } from '~/shared/types/mode';
import { PostType } from '~/shared/types/postType';
import { useGetProfile, useGetMyPosts, useGetMemberPosts } from '~/entity/profile';
import { usePullToRefresh } from '~/shared/model/usePullToRefresh';
import { useErrorToastOnTransition } from '~/shared/model/useErrorToastOnTransition';
import { LoadingView } from '~/shared/ui/LoadingView';

type TradeTab = 'purchased' | 'sold';
type CounterpartRole = 'seller' | 'buyer';

const TRADE_TABS = [
  { value: 'purchased' as const, label: '구매내역' },
  { value: 'sold' as const, label: '판매내역' },
];

const TradePostCard = memo(
  ({ post, counterpartRole }: { post: PostType; counterpartRole: CounterpartRole }) => {
    const router = useRouter();
    const { id, title, gwangsan } = post;
    const counterpart = post[counterpartRole];
    const counterpartLabel = counterpartRole === 'seller' ? '판매자' : '구매자';
    const testPrefix = counterpartRole === 'seller' ? 'purchased' : 'sold';
    const isTemporary = id < 0;

    const handlePress = useCallback(() => {
      if (isTemporary || !acquireNavigationLock()) return;
      router.push(`/post/${id}`);
    }, [router, id, isTemporary]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={isTemporary ? 1 : 0.7}
        disabled={isTemporary}
        className="overflow-hidden rounded-2xl bg-gray-50"
        testID={`${testPrefix}-card-${id}`}>
        <View className="flex-row items-center gap-4 px-5 py-5">
          <PostThumbnail post={post} />
          <View className="flex-1 gap-1">
            <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-sm text-gray-500">{gwangsan} 광산</Text>
            {counterpart && (
              <Text
                testID={`${testPrefix}-card-${counterpartRole}-${id}`}
                className="text-sm font-medium text-gray-700">
                {counterpartLabel} {counterpart.nickname}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

const TradePanel = memo(
  ({
    posts,
    counterpartRole,
    emptyMessage,
    width,
    refreshing,
    onRefresh,
  }: {
    posts: PostType[];
    counterpartRole: CounterpartRole;
    emptyMessage: string;
    width: number;
    refreshing: boolean;
    onRefresh: () => void;
  }) => (
    <FlatList
      testID={`${counterpartRole === 'seller' ? 'purchased' : 'sold'}-list`}
      style={{ width }}
      data={posts}
      keyExtractor={(post) => String(post.id)}
      renderItem={({ item }) => <TradePostCard post={item} counterpartRole={counterpartRole} />}
      ItemSeparatorComponent={() => <View className="h-4" />}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 36,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text className="pt-20 text-center text-gray-500">{emptyMessage}</Text>}
    />
  )
);

export default function PurchasedPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);
  const [activeTab, setActiveTab] = useState<TradeTab>('purchased');

  const { data: profileData } = useGetProfile(id);
  const myPosts = useGetMyPosts(isMe);
  const otherPosts = useGetMemberPosts(id);
  const { data: postsData, isError, isLoading, refetch } = isMe ? myPosts : otherPosts;

  const { refreshing, onRefresh: handleRefresh } = usePullToRefresh(refetch);

  const purchasedPosts = useMemo(
    () =>
      Array.isArray(postsData)
        ? postsData.filter((post) => post.mode === MODE.RECEIVER && post.isCompleted)
        : [],
    [postsData]
  );
  const soldPosts = useMemo(
    () =>
      Array.isArray(postsData)
        ? postsData.filter((post) => post.mode === MODE.GIVER && post.isCompleted)
        : [],
    [postsData]
  );

  // 받아둔 목록이 없으면 오류 화면이 대신 보이므로, 목록을 유지한 채 새로고침이 실패했을 때만 알린다
  useErrorToastOnTransition(
    isError,
    '글을 불러오는데 실패했습니다.',
    '잠시 후 다시 시도해 주세요.',
    !!postsData
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header
        headerTitle={isMe ? '거래내역' : `${profileData?.nickname ?? ''}님의 거래 내역`}
        showBackButton
      />
      <TabPager
        tabs={TRADE_TABS}
        value={activeTab}
        onChange={setActiveTab}
        testIDPrefix="trade-tab"
        fallback={
          !postsData && isLoading ? (
            <LoadingView testID="trade-history-loading" size="large" />
          ) : !postsData && isError ? (
            <ErrorFallback title="거래내역을 불러오지 못했습니다." onRetry={() => refetch()} />
          ) : undefined
        }>
        {(screenWidth) => (
          <>
            <TradePanel
              posts={purchasedPosts}
              counterpartRole="seller"
              emptyMessage="구매 내역이 없습니다."
              width={screenWidth}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
            <TradePanel
              posts={soldPosts}
              counterpartRole="buyer"
              emptyMessage="판매 내역이 없습니다."
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
