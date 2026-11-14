import { memo, useCallback } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MODE, ModeType } from '~/shared/types/mode';
import { PostType } from '~/shared/types/postType';
import { ProductType, TYPE } from '~/shared/types/type';
import type { ReviewPostType } from '~/entity/reviews';
import { useThemeColors } from '~/shared/lib/theme';
import { acquireNavigationLock } from '~/shared/lib/navigationGuard';
import { PostThumbnail } from '~/shared/ui/PostThumbnail';

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

export const SellingPostCard = memo(
  ({
    post,
    receivedReviews,
    isReviewsLoading,
    onMenuPress,
  }: {
    post: PostType;
    receivedReviews?: ReviewPostType[];
    isReviewsLoading?: boolean;
    onMenuPress: (post: PostType) => void;
  }) => {
    const router = useRouter();
    const colors = useThemeColors();
    const { id, type, mode, title, gwangsan, isCompleted, buyer } = post;
    const isTemporary = id < 0;

    const handlePress = useCallback(() => {
      if (isTemporary || !acquireNavigationLock()) return;
      router.push(`/post/${id}`);
    }, [router, id, isTemporary]);

    const handleMenuPress = useCallback(() => {
      onMenuPress(post);
    }, [onMenuPress, post]);

    // 이 게시물(거래)에 대해 실제로 받은 후기가 있을 때만 버튼을 보여주고 그 상세로 이동한다
    const matchedReview = receivedReviews?.find((review) => review.productId === id);

    const handleReviewsPress = useCallback(() => {
      if (!matchedReview) return;
      router.push(`/cancelTrade/${matchedReview.reviewId}`);
    }, [router, matchedReview]);

    return (
      <View className="overflow-hidden rounded-2xl bg-gray-50">
        <View className="gap-4 px-5 py-5">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={handlePress}
              className="flex-1 flex-row items-center gap-4"
              activeOpacity={isTemporary ? 1 : 0.7}
              disabled={isTemporary}
              accessibilityRole="button"
              accessibilityLabel={`${title}, ${gwangsan} 광산, ${STATUS_LABEL[type][mode]}${isCompleted && buyer ? `, 구매자 ${buyer.nickname}` : ''}`}>
              <PostThumbnail post={post} />
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="shrink text-lg font-semibold text-foreground" numberOfLines={1}>
                    {title}
                  </Text>
                  {isCompleted && buyer && (
                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                      구매자 {buyer.nickname}
                    </Text>
                  )}
                </View>
                <Text className="text-sm font-medium text-gray-700">
                  {STATUS_LABEL[type][mode]}
                </Text>
                <Text className="text-sm text-gray-500">{gwangsan} 광산</Text>
              </View>
            </TouchableOpacity>
            {!isTemporary && !isCompleted && (
              <TouchableOpacity
                onPress={handleMenuPress}
                accessibilityRole="button"
                accessibilityLabel="게시글 메뉴"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1"
                testID={`selling-card-menu-${id}`}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors['gray-400']} />
              </TouchableOpacity>
            )}
          </View>
          {!isTemporary && isCompleted && isReviewsLoading && (
            <View
              className="w-full items-center rounded-lg bg-main-500 px-5 py-2.5"
              testID={`selling-card-reviews-loading-${id}`}>
              <ActivityIndicator color="white" />
            </View>
          )}
          {!isTemporary && isCompleted && !isReviewsLoading && matchedReview && (
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
  }
);
