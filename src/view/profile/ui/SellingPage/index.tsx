import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Header, PillTabs } from '~/shared/ui';
import Post from '~/shared/ui/Post';
import { MODE } from '~/shared/types/mode';
import { PostType } from '~/shared/types/postType';
import { useGetProfile } from '../../model/useGetProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import { useGetPosts } from '../../model/useGetPosts';

type SellingTab = 'onSale' | 'sold';

const SELLING_TABS = [
  { value: 'onSale' as const, label: '판매중' },
  { value: 'sold' as const, label: '판매완료' },
];

const getTabIndex = (tab: SellingTab) => SELLING_TABS.findIndex((t) => t.value === tab);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SellingPanel = ({ posts, emptyMessage }: { posts: PostType[]; emptyMessage: string }) => (
  <ScrollView style={{ width: SCREEN_WIDTH }} showsVerticalScrollIndicator={false}>
    <View className="gap-6 px-6 pb-9">
      {posts.length > 0 ? (
        posts.map((post) => <Post {...post} key={post.id} />)
      ) : (
        <Text className="pt-20 text-center text-gray-500">{emptyMessage}</Text>
      )}
    </View>
  </ScrollView>
);

export default function SellingPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);
  const [activeTab, setActiveTab] = useState<SellingTab>('onSale');
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
  const sellingPosts = Array.isArray(postsData)
    ? postsData.filter((post) => post.mode === MODE.GIVER)
    : [];
  const onSalePosts = sellingPosts.filter((post) => !post.isCompleted);
  const soldPosts = sellingPosts.filter((post) => post.isCompleted);

  if (isError) {
    Toast.show({
      type: 'error',
      text1: '글을 불러오는데 실패했습니다.',
      text2: error?.message || '잠시 후 다시 시도해주세요.',
    });
  }

  const handleTabChange = (tab: SellingTab) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ x: getTabIndex(tab) * SCREEN_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const tab = SELLING_TABS[index]?.value;
    if (tab && tab !== activeTab) setActiveTab(tab);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header
        headerTitle={isMe ? '판매관리' : `${profileData?.nickname ?? ''}님의 판매 목록`}
        showBackButton
      />
      <PillTabs
        tabs={SELLING_TABS}
        value={activeTab}
        onChange={handleTabChange}
        containerClassName="mx-6 mb-3 mt-3"
        testIDPrefix="selling-tab"
      />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}>
        <SellingPanel posts={onSalePosts} emptyMessage="판매 중인 게시물이 없습니다." />
        <SellingPanel posts={soldPosts} emptyMessage="판매 완료된 게시물이 없습니다." />
      </ScrollView>
    </SafeAreaView>
  );
}
