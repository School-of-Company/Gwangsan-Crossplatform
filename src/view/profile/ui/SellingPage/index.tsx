import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Header, PillTabs, BottomSheetModalWrapper, Button, AlertModal } from '~/shared/ui';
import { MODE, ModeType } from '~/shared/types/mode';
import { PostType } from '~/shared/types/postType';
import { ProductType, TYPE } from '~/shared/types/type';
import { deletePost } from '~/entity/post/api/deletePost';
import { useGetProfile } from '../../model/useGetProfile';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import { useGetPosts } from '../../model/useGetPosts';

type SellingTab = 'onSale' | 'sold';

const SELLING_TABS = [
  { value: 'onSale' as const, label: '판매중' },
  { value: 'sold' as const, label: '판매완료' },
];

const getTabIndex = (tab: SellingTab) => SELLING_TABS.findIndex((t) => t.value === tab);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_LABEL: Record<ProductType, Record<ModeType, string>> = {
  [TYPE.OBJECT]: {
    [MODE.GIVER]: '물건을 팔아요',
    [MODE.RECEIVER]: '물건이 필요해요',
  },
  [TYPE.SERVICE]: {
    [MODE.GIVER]: '서비스를 할 수 있어요',
    [MODE.RECEIVER]: '서비스를 해주세요',
  },
};

interface ActionSheetRowProps {
  label: string;
  labelClassName?: string;
  disabled?: boolean;
  onPress?: () => void;
}

// 카드 우측 점 3개 메뉴(수정/삭제/닫기) 버튼 한 줄. 눌렀을 때 살짝 작아지는 효과를 준다.
const ActionSheetRow = ({
  label,
  labelClassName = 'text-gray-900',
  disabled = false,
  onPress,
}: ActionSheetRowProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={disabled ? 'opacity-50' : ''}>
      <Animated.View
        className="h-[56px] items-center justify-center"
        style={{ transform: [{ scale }] }}>
        <Text className={`text-lg font-medium ${labelClassName}`}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SellingPostCard = ({
  post,
  reviewsMemberId,
  onMenuPress,
}: {
  post: PostType;
  reviewsMemberId?: number;
  onMenuPress: (post: PostType) => void;
}) => {
  const router = useRouter();
  const { id, type, mode, title, gwangsan, isCompleted, buyer, imageUrls = [], images = [] } = post;
  const isTemporary = id < 0;

  const handlePress = useCallback(() => {
    if (isTemporary) return;
    router.push(`/post/${id}`);
  }, [router, id, isTemporary]);

  const handleMenuPress = useCallback(() => {
    onMenuPress(post);
  }, [onMenuPress, post]);

  const handleReviewsPress = useCallback(() => {
    if (reviewsMemberId == null) return;
    router.push(`/reviews/${reviewsMemberId}`);
  }, [router, reviewsMemberId]);

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
    <View className="overflow-hidden rounded-2xl bg-gray-50">
      <View className="gap-4 px-5 py-5">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handlePress}
            className="flex-1 flex-row items-center gap-4"
            activeOpacity={isTemporary ? 1 : 0.7}
            disabled={isTemporary}>
            <ExpoImage
              source={firstImage ? { uri: firstImage } : require('~/shared/assets/png/icon.png')}
              style={{ width: 80, height: 80, borderRadius: 12 }}
              cachePolicy="memory"
              contentFit="cover"
              recyclingKey={firstImage ?? 'placeholder'}
              transition={200}
            />
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="shrink text-lg font-semibold" numberOfLines={1}>
                  {title}
                </Text>
                {isCompleted && buyer && (
                  <Text className="text-xs text-gray-500" numberOfLines={1}>
                    구매자 {buyer.nickname}
                  </Text>
                )}
              </View>
              <Text className="text-sm font-medium text-gray-700">{STATUS_LABEL[type][mode]}</Text>
              <Text className="text-sm text-gray-500">{gwangsan} 광산</Text>
            </View>
          </TouchableOpacity>
          {!isTemporary && !isCompleted && (
            <TouchableOpacity
              onPress={handleMenuPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="p-1"
              testID={`selling-card-menu-${id}`}>
              <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        {!isTemporary && isCompleted && reviewsMemberId != null && (
          <TouchableOpacity
            onPress={handleReviewsPress}
            className="w-full items-center rounded-lg bg-main-500 px-5 py-2.5"
            testID={`selling-card-reviews-${id}`}>
            <Text className="text-label font-medium text-white">받은 후기 보기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const SellingPanel = memo(
  ({
    posts,
    emptyMessage,
    reviewsMemberId,
    onMenuPress,
  }: {
    posts: PostType[];
    emptyMessage: string;
    reviewsMemberId?: number;
    onMenuPress: (post: PostType) => void;
  }) => (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      <View className="gap-4 px-6 pb-9">
        {posts.length > 0 ? (
          posts.map((post) => (
            <SellingPostCard
              post={post}
              reviewsMemberId={reviewsMemberId}
              onMenuPress={onMenuPress}
              key={post.id}
            />
          ))
        ) : (
          <Text className="pt-20 text-center text-gray-500">{emptyMessage}</Text>
        )}
      </View>
    </ScrollView>
  )
);

export default function SellingPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SellingTab>('onSale');
  const [actionTargetPost, setActionTargetPost] = useState<PostType | null>(null);
  // 삭제 확인 AlertModal은 액션 시트가 닫힌 뒤에도 열려있어야 하므로 대상 postId를 따로 보관한다
  const [deleteTargetPostId, setDeleteTargetPostId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { data: profileData } = useGetProfile(id);
  const { data: myProfileData } = useGetMyProfile(isMe);
  const { data: myPostsData, error: myPostsError, isError: myPostsIsError } = useGetMyPosts(isMe);
  const {
    data: otherPostsData,
    error: otherPostsError,
    isError: otherPostsIsError,
  } = useGetPosts(id);

  const postsData = isMe ? myPostsData : otherPostsData;
  const isError = isMe ? myPostsIsError : otherPostsIsError;
  const error = isMe ? myPostsError : otherPostsError;
  const sellingPosts = useMemo(
    () => (Array.isArray(postsData) ? postsData.filter((post) => post.mode === MODE.GIVER) : []),
    [postsData]
  );
  const onSalePosts = useMemo(
    () => sellingPosts.filter((post) => !post.isCompleted),
    [sellingPosts]
  );
  const soldPosts = useMemo(() => sellingPosts.filter((post) => post.isCompleted), [sellingPosts]);
  const reviewsMemberId = isMe ? myProfileData?.memberId : profileData?.memberId;

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts', 'current'] });
      Toast.show({
        type: 'success',
        text1: '게시글 삭제 완료',
        text2: '게시글이 성공적으로 삭제되었습니다.',
        visibilityTime: 2000,
      });
    },
    onError: (deleteError) => {
      Toast.show({
        type: 'error',
        text1: '게시글 삭제 실패',
        text2:
          deleteError instanceof Error
            ? deleteError.message
            : '게시글 삭제 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    },
  });

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
    setDeleteTargetPostId(actionTargetPost.id);
    setActionTargetPost(null);
  }, [actionTargetPost]);

  const handleCloseDeleteAlert = useCallback(() => {
    setDeleteTargetPostId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTargetPostId === null) return;
    deletePostMutation.mutate(deleteTargetPostId);
    setDeleteTargetPostId(null);
  }, [deleteTargetPostId, deletePostMutation]);

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
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}>
        <SellingPanel
          posts={onSalePosts}
          emptyMessage="판매 중인 게시물이 없습니다."
          onMenuPress={handleMenuPress}
        />
        <SellingPanel
          posts={soldPosts}
          emptyMessage="판매 완료된 게시물이 없습니다."
          reviewsMemberId={reviewsMemberId}
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
              label={deletePostMutation.isPending ? '삭제 중...' : '삭제하기'}
              labelClassName="text-error-500"
              disabled={deletePostMutation.isPending}
              onPress={handleDeletePress}
            />
          </View>
          <View className="mb-3">
            <Button
              variant="neutral"
              onPress={handleCloseActionSheet}
              disabled={deletePostMutation.isPending}
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
        isLoading={deletePostMutation.isPending}
        onCancel={handleCloseDeleteAlert}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}
