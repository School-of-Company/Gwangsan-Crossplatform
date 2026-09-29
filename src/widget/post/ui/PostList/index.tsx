import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import Post from '~/shared/ui/Post';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';
import { useCallback, useMemo, useState } from 'react';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { useGetBlockList } from '~/entity/profile/model/useGetBlockList';
import { returnValue } from '~/view/post/model/handleCategory';
import { Category } from '~/view/post/model/category';
import { VirtualList } from 'scrolloop/native';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';

export default function PostList({ category, type }: { category: Category; type: ProductType }) {
  const [refreshing, setRefreshing] = useState(false);
  const currentMode = category ? returnValue(category) : undefined;

  const {
    data: postsData = [],
    refetch,
    isLoading: isPostsLoading,
    isError: isPostsError,
    data: rawPosts,
  } = useGetPosts(currentMode as ModeType | undefined, type as ProductType | undefined);
  const {
    data: blockList,
    isLoading: isBlockListLoading,
    isError: isBlockListError,
    refetch: refetchBlockList,
  } = useGetBlockList();

  const data = useMemo(
    () => postsData.filter((post) => !blockList?.some((b) => b.memberId === post.member?.memberId)),
    [postsData, blockList]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    (index: number) => {
      const item = data[index];
      if (!item) return null;
      return <Post {...item} />;
    },
    [data]
  );

  // 조회에 실패했는데 "게시물이 없습니다."로 보이면 사용자가 실패를 알 수 없다(#740)
  if (isPostsError && !rawPosts) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  // 차단 목록을 불러오지 못하면 차단한 사용자의 글을 걸러낼 수 없다. 차단한 사람의 글이 보이는 대신
  // 목록을 보여주지 않고 다시 시도하게 한다(#740)
  if (isBlockListError && !blockList) {
    return <ErrorFallback onRetry={() => refetchBlockList()} />;
  }

  if ((isPostsLoading && !rawPosts) || (isBlockListLoading && !blockList)) {
    return (
      <View testID="post-list-loading" className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color="#8FC31D" />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-center text-gray-500">게시물이 없습니다.</Text>
      </View>
    );
  }

  return (
    <VirtualList
      decelerationRate={0}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      itemSize={120}
      overscan={12}
      count={data.length}
      renderItem={renderItem}
    />
  );
}
