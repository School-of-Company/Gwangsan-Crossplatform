import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Header, PillTabs } from '~/shared/ui';
import Post from '~/shared/ui/Post';
import { SlideFadeTransition, TabTransitionDirection } from '~/shared/ui/SlideFadeTransition';
import { MODE } from '~/shared/types/mode';
import { useGetProfile } from '../../model/useGetProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import { useGetPosts } from '../../model/useGetPosts';

type SellingTab = 'onSale' | 'sold';

const SELLING_TABS = [
  { value: 'onSale' as const, label: '판매중' },
  { value: 'sold' as const, label: '판매완료' },
];

const getTabIndex = (tab: SellingTab) => SELLING_TABS.findIndex((t) => t.value === tab);

export default function SellingPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);
  const [activeTab, setActiveTab] = useState<SellingTab>('onSale');
  const [direction, setDirection] = useState<TabTransitionDirection>(null);

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
  const visiblePosts = sellingPosts.filter((post) =>
    activeTab === 'onSale' ? !post.isCompleted : post.isCompleted
  );

  if (isError) {
    Toast.show({
      type: 'error',
      text1: '글을 불러오는데 실패했습니다.',
      text2: error?.message || '잠시 후 다시 시도해주세요.',
    });
  }

  const handleTabChange = (tab: SellingTab) => {
    setDirection(getTabIndex(tab) > getTabIndex(activeTab) ? 'right' : 'left');
    setActiveTab(tab);
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <SlideFadeTransition key={activeTab} direction={direction}>
          <View className="gap-6 px-6 pb-9">
            {visiblePosts.length > 0 ? (
              visiblePosts.map((post) => <Post {...post} key={post.id} />)
            ) : (
              <Text className="pt-20 text-center text-gray-500">
                {activeTab === 'onSale'
                  ? '판매 중인 게시물이 없습니다.'
                  : '판매 완료된 게시물이 없습니다.'}
              </Text>
            )}
          </View>
        </SlideFadeTransition>
      </ScrollView>
    </SafeAreaView>
  );
}
