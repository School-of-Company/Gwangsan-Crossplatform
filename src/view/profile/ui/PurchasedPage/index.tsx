import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Header, PillTabs } from '~/shared/ui';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import { MODE } from '~/shared/types/mode';
import { PostType } from '~/shared/types/postType';
import { useGetProfile } from '~/entity/profile/model/useGetProfile';
import { useGetMyPosts } from '~/entity/profile/model/useGetMyPosts';
import { useGetMemberPosts } from '~/entity/profile/model/useGetMemberPosts';

type TradeTab = 'purchased' | 'sold';
type CounterpartRole = 'seller' | 'buyer';

const TRADE_TABS = [
  { value: 'purchased' as const, label: '구매내역' },
  { value: 'sold' as const, label: '판매내역' },
];

const getTabIndex = (tab: TradeTab) => TRADE_TABS.findIndex((t) => t.value === tab);

const TradePostCard = ({
  post,
  counterpartRole,
}: {
  post: PostType;
  counterpartRole: CounterpartRole;
}) => {
  const router = useRouter();
  const { id, title, gwangsan, imageUrls = [], images = [] } = post;
  const counterpart = post[counterpartRole];
  const counterpartLabel = counterpartRole === 'seller' ? '판매자' : '구매자';
  const testPrefix = counterpartRole === 'seller' ? 'purchased' : 'sold';
  const isTemporary = id < 0;

  const handlePress = useCallback(() => {
    if (isTemporary) return;
    router.push(`/post/${id}`);
  }, [router, id, isTemporary]);

  const firstImage =
    imageUrls?.[0]?.imageUrl ??
    (Array.isArray(images) && images.length > 0
      ? typeof images[0] === 'string'
        ? images[0]
        : (images[0]?.imageUrl ?? null)
      : null);

  useEffect(() => {
    if (firstImage) {
      ExpoImage.prefetch(firstImage);
    }
  }, [firstImage]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={isTemporary ? 1 : 0.7}
      disabled={isTemporary}
      className="overflow-hidden rounded-2xl bg-gray-50"
      testID={`${testPrefix}-card-${id}`}>
      <View className="flex-row items-center gap-4 px-5 py-5">
        <ExpoImage
          source={firstImage ? { uri: firstImage } : require('~/shared/assets/png/icon.png')}
          style={{ width: 80, height: 80, borderRadius: 12 }}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={firstImage ?? 'placeholder'}
          transition={200}
        />
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
};

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
  const scrollRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const { data: profileData } = useGetProfile(id);
  const myPosts = useGetMyPosts(isMe);
  const otherPosts = useGetMemberPosts(id);
  const { data: postsData, isError, isLoading, refetch } = isMe ? myPosts : otherPosts;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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

  // 받아둔 목록이 없으면 오류 화면이 대신 보이므로, 목록을 유지한 채 새로고침이 실패했을 때만 알린다.
  // 렌더 중에 Toast.show를 부르면 리렌더될 때마다 반복되므로 실패로 바뀌는 순간에만 띄운다
  useEffect(() => {
    if (!isError || !postsData) return;
    Toast.show({
      type: 'error',
      text1: '글을 불러오는데 실패했습니다.',
      text2: '잠시 후 다시 시도해 주세요.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  const handleTabChange = (tab: TradeTab) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ x: getTabIndex(tab) * screenWidth, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    const tab = TRADE_TABS[index]?.value;
    if (tab && tab !== activeTab) setActiveTab(tab);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header
        headerTitle={isMe ? '거래내역' : `${profileData?.nickname ?? ''}님의 거래 내역`}
        showBackButton
      />
      <PillTabs
        tabs={TRADE_TABS}
        value={activeTab}
        onChange={handleTabChange}
        containerClassName="mx-6 mb-3 mt-3"
        testIDPrefix="trade-tab"
      />
      {!postsData && isLoading ? (
        <View testID="trade-history-loading" className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8FC31D" />
        </View>
      ) : !postsData && isError ? (
        <ErrorFallback title="거래내역을 불러오지 못했습니다." onRetry={() => refetch()} />
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}>
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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
