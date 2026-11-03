import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Header, PillTabs, BottomSheetModalWrapper, Button, AlertModal } from '~/shared/ui';
import { ActionSheetRow, SellingPanel } from '~/widget/profile';
import { PostType } from '~/shared/types/postType';
import { useDeletePost } from '~/entity/post';
import {
  useGetProfile,
  useGetMyProfile,
  useGetMyInformation,
  useGetSellingPosts,
  sellingPostsQueryKeys,
} from '~/entity/profile';
import { profileQueryKeys } from '~/shared/model/profileQueryKeys';
import { useGetReviews } from '~/entity/reviews';

type SellingTab = 'onSale' | 'sold';

const SELLING_TABS = [
  { value: 'onSale' as const, label: '판매중' },
  { value: 'sold' as const, label: '판매완료' },
];

const getTabIndex = (tab: SellingTab) => SELLING_TABS.findIndex((t) => t.value === tab);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SellingPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SellingTab>('onSale');
  const [actionTargetPost, setActionTargetPost] = useState<PostType | null>(null);
  // 삭제 확인 AlertModal은 액션 시트가 닫힌 뒤에도 열려있어야 하므로 대상 postId를 따로 보관한다
  const [deleteTargetPostId, setDeleteTargetPostId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { data: profileData } = useGetProfile(id);
  const { data: myProfileData } = useGetMyProfile(isMe);
  // 판매중/판매완료를 전체 받은 뒤 로컬에서 나누지 않고, completed를 서버 필터로 넘겨
  // 탭별로 따로 커서를 관리한다. 판매중(completed=false)에는 예약중도 포함된다.
  const sellingPostsMemberId = isMe ? undefined : id;
  const onSaleQuery = useGetSellingPosts({ memberId: sellingPostsMemberId, completed: false });
  const soldQuery = useGetSellingPosts({ memberId: sellingPostsMemberId, completed: true });

  const isError = onSaleQuery.isError || soldQuery.isError;
  const error = onSaleQuery.error ?? soldQuery.error;
  const reviewsMemberId = isMe ? myProfileData?.memberId : profileData?.memberId;
  // react-query v5의 isLoading은 isPending && isFetching이라 아직 enabled:false로
  // 대기 중인(= myInfo를 기다리는) 상태에서는 false를 반환한다. 그 시점에도 data는
  // 여전히 undefined이므로, "아직 받아오지 못함"을 정확히 판별하려면 isPending을 써야 한다
  const { data: myInfo } = useGetMyInformation();
  const { data: receivedReviews, isPending: isReviewsLoading } = useGetReviews(
    'receive',
    reviewsMemberId != null ? String(reviewsMemberId) : undefined,
    { myMemberId: myInfo?.memberId }
  );

  const { deletePostInPlace, isLoading: isDeletingPost } = useDeletePost({
    // 구매 목록(PurchasedPage)은 아직 기존 전체 조회를 쓰므로 함께 무효화한다.
    invalidateKeys: [
      sellingPostsQueryKeys.all,
      profileQueryKeys.myPostsAll,
      profileQueryKeys.memberPostsAll,
    ],
  });

  // 렌더 중에 Toast.show를 부르면 리렌더될 때마다 토스트가 반복되므로, 실패로 바뀌는 순간에만 띄운다
  useEffect(() => {
    if (!isError) return;
    Toast.show({
      type: 'error',
      text1: '글을 불러오는데 실패했습니다.',
      text2: error?.message || '잠시 후 다시 시도해주세요.',
    });
    // 같은 실패가 이어지는 동안 에러 객체가 바뀌어도 다시 띄우지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  const handleTabChange = (tab: SellingTab) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ x: getTabIndex(tab) * SCREEN_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const tab = SELLING_TABS[index]?.value;
    if (tab && tab !== activeTab) setActiveTab(tab);
  };

  const handleMenuPress = useCallback((post: PostType) => {
    setActionTargetPost(post);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setActionTargetPost(null);
  }, []);

  const handleEditPress = useCallback(() => {
    if (!actionTargetPost) return;
    const postId = actionTargetPost.id;
    setActionTargetPost(null);
    router.push(`/write?id=${postId}`);
  }, [actionTargetPost, router]);

  const handleDeletePress = useCallback(() => {
    if (!actionTargetPost) return;
    if (actionTargetPost.isReserved) {
      setActionTargetPost(null);
      Toast.show({
        type: 'error',
        text1: '삭제할 수 없어요',
        text2: '예약 중인 게시글은 삭제할 수 없습니다. 예약을 취소한 후 다시 시도해 주세요.',
      });
      return;
    }
    setDeleteTargetPostId(actionTargetPost.id);
    setActionTargetPost(null);
  }, [actionTargetPost]);

  const handleCloseDeleteAlert = useCallback(() => {
    setDeleteTargetPostId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTargetPostId === null) return;
    deletePostInPlace(deleteTargetPostId);
    setDeleteTargetPostId(null);
  }, [deleteTargetPostId, deletePostInPlace]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
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
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}>
        <SellingPanel
          testIDPrefix="selling-panel-onSale"
          posts={onSaleQuery.posts}
          emptyMessage="판매 중인 게시물이 없습니다."
          isPending={onSaleQuery.isPending}
          isRefetching={onSaleQuery.isRefetching}
          isFetchingNextPage={onSaleQuery.isFetchingNextPage}
          isFetchNextPageError={onSaleQuery.isFetchNextPageError}
          onEndReached={onSaleQuery.loadMore}
          onRetryNextPage={onSaleQuery.retryNextPage}
          onRefresh={onSaleQuery.refetch}
          onMenuPress={handleMenuPress}
        />
        <SellingPanel
          testIDPrefix="selling-panel-sold"
          posts={soldQuery.posts}
          emptyMessage="판매 완료된 게시물이 없습니다."
          receivedReviews={receivedReviews}
          isReviewsLoading={isReviewsLoading}
          isPending={soldQuery.isPending}
          isRefetching={soldQuery.isRefetching}
          isFetchingNextPage={soldQuery.isFetchingNextPage}
          isFetchNextPageError={soldQuery.isFetchNextPageError}
          onEndReached={soldQuery.loadMore}
          onRetryNextPage={soldQuery.retryNextPage}
          onRefresh={soldQuery.refetch}
          onMenuPress={handleMenuPress}
        />
      </ScrollView>

      <BottomSheetModalWrapper
        isVisible={actionTargetPost !== null}
        onClose={handleCloseActionSheet}
        title=""
        hasHeader={false}
        height={280}>
        <View className="mt-4 gap-3">
          <View className="overflow-hidden rounded-2xl bg-gray-50">
            <ActionSheetRow label="게시글 수정" onPress={handleEditPress} />
          </View>
          <View className="overflow-hidden rounded-2xl bg-gray-50">
            <ActionSheetRow
              label={
                isDeletingPost
                  ? '삭제 중...'
                  : actionTargetPost?.isReserved
                    ? '예약 중에는 삭제할 수 없어요'
                    : '삭제하기'
              }
              labelClassName="text-error-500"
              disabled={isDeletingPost}
              onPress={handleDeletePress}
            />
          </View>
          <View className="mb-3">
            <Button
              variant="neutral"
              onPress={handleCloseActionSheet}
              disabled={isDeletingPost}
              width="w-full">
              <Text className="text-gray-900">닫기</Text>
            </Button>
          </View>
        </View>
      </BottomSheetModalWrapper>

      <AlertModal
        isVisible={deleteTargetPostId !== null}
        message="이 게시글을 삭제하시겠습니까?"
        confirmText="삭제"
        destructive
        isLoading={isDeletingPost}
        onCancel={handleCloseDeleteAlert}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}
