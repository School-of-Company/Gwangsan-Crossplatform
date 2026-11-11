import { memo, useCallback } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PostType } from '~/shared/types/postType';
import type { ReviewPostType } from '~/entity/reviews';
import { SellingPostCard } from '../SellingPostCard';
import { Spinner } from '~/shared/ui/Spinner';

const keyExtractor = (post: PostType) => String(post.id);

export interface SellingPanelProps {
  testIDPrefix: string;
  width: number;
  posts: PostType[];
  emptyMessage: string;
  receivedReviews?: ReviewPostType[];
  isReviewsLoading?: boolean;
  isPending: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onEndReached: () => void;
  onRetryNextPage: () => void;
  onRefresh: () => void;
  onMenuPress: (post: PostType) => void;
}

// 게시글이 많아질 수 있어 목록은 FlatList로 가상화하고, 끝에 닿으면 다음 페이지를
// 이어서 받는다. 추가 로딩 실패는 목록을 비우지 않고 하단에서 재시도로 복구한다.
export const SellingPanel = memo(
  ({
    testIDPrefix,
    width,
    posts,
    emptyMessage,
    receivedReviews,
    isReviewsLoading,
    isPending,
    isRefetching,
    isFetchingNextPage,
    isFetchNextPageError,
    onEndReached,
    onRetryNextPage,
    onRefresh,
    onMenuPress,
  }: SellingPanelProps) => {
    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<PostType>) => (
        <SellingPostCard
          post={item}
          receivedReviews={receivedReviews}
          isReviewsLoading={isReviewsLoading}
          onMenuPress={onMenuPress}
        />
      ),
      [receivedReviews, isReviewsLoading, onMenuPress]
    );

    const renderFooter = useCallback(() => {
      if (isFetchNextPageError) {
        return (
          <TouchableOpacity
            testID={`${testIDPrefix}-retry`}
            onPress={onRetryNextPage}
            className="items-center rounded-lg bg-gray-50 px-5 py-3">
            <Text className="text-label text-gray-700">
              더 불러오지 못했습니다. 다시 시도하려면 누르세요.
            </Text>
          </TouchableOpacity>
        );
      }

      if (isFetchingNextPage) {
        return (
          <View testID={`${testIDPrefix}-loading-more`} className="items-center py-4">
            <Spinner />
          </View>
        );
      }

      return null;
    }, [isFetchNextPageError, isFetchingNextPage, onRetryNextPage, testIDPrefix]);

    const renderEmpty = useCallback(() => {
      if (isPending) {
        return (
          <View testID={`${testIDPrefix}-loading`} className="pt-20">
            <Spinner />
          </View>
        );
      }

      return <Text className="pt-20 text-center text-gray-500">{emptyMessage}</Text>;
    }, [isPending, emptyMessage, testIDPrefix]);

    return (
      <FlatList
        testID={testIDPrefix}
        style={{ width }}
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 24, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />
    );
  }
);
