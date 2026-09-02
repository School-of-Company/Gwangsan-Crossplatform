import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Header, PillTabs } from '~/shared/ui';
import { MODE } from '~/shared/types/mode';
import { PostType } from '~/shared/types/postType';
import { useGetProfile } from '../../model/useGetProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import { useGetPosts } from '../../model/useGetPosts';

type TradeTab = 'purchased' | 'sold';
type CounterpartRole = 'seller' | 'buyer';

const TRADE_TABS = [
  { value: 'purchased' as const, label: '구매내역' },
  { value: 'sold' as const, label: '판매내역' },
];

const getTabIndex = (tab: TradeTab) => TRADE_TABS.findIndex((t) => t.value === tab);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
          cachePolicy="memory"
          contentFit="cover"
          recyclingKey={firstImage ?? 'placeholder'}
          transition={200}
        />
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold" numberOfLines={1}>
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
  }: {
    posts: PostType[];
    counterpartRole: CounterpartRole;
    emptyMessage: string;
  }) => (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      <View className="gap-4 px-6 pb-9 pt-3">
        {posts.length > 0 ? (
          posts.map((post) => (
            <TradePostCard post={post} counterpartRole={counterpartRole} key={post.id} />
          ))
        ) : (
          <Text className="pt-20 text-center text-gray-500">{emptyMessage}</Text>
        )}
      </View>
    </ScrollView>
  )
);

export default function PurchasedPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);
  const [activeTab, setActiveTab] = useState<TradeTab>('purchased');
  const scrollRef = useRef<ScrollView>(null);

  const { data: profileData } = useGetProfile(id);
  const { data: myPostsData, error: myPostsError, isError: myPostsIsError } = useGetMyPosts(isMe);
  const {
    data: otherPostsData,
    error: otherPostsError,
    isError: otherPostsIsError,
  } = useGetPosts(id);

  const postsData = isMe ? myPostsData : otherPostsData;
  const isError = isMe ? myPostsIsError : otherPostsIsError;
  const error = isMe ? myPostsError : otherPostsError;

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

  if (isError) {
    Toast.show({
      type: 'error',
      text1: '글을 불러오는데 실패했습니다.',
      text2: error?.message || '잠시 후 다시 시도해주세요.',
    });
  }

  const handleTabChange = (tab: TradeTab) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ x: getTabIndex(tab) * SCREEN_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const tab = TRADE_TABS[index]?.value;
    if (tab && tab !== activeTab) setActiveTab(tab);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
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
        />
        <TradePanel
          posts={soldPosts}
          counterpartRole="buyer"
          emptyMessage="판매 내역이 없습니다."
        />
      </ScrollView>
    </SafeAreaView>
  );
}
