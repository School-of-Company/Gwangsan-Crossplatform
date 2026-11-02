import {
  ActivityIndicator,
  LayoutChangeEvent,
  RefreshControl,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Post from '~/shared/ui/Post';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';
import { useCallback, useMemo, useState } from 'react';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { useGetBlockList } from '~/entity/profile/model/useGetBlockList';
import { returnValue } from '~/entity/post/model/handleCategory';
import { Category } from '~/entity/post/model/category';
import { VirtualList } from 'scrolloop/native';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';

// Post 카드 한 장의 높이. VirtualList는 이 값으로 각 카드를 absolute 배치하므로 카드가 이보다 커지면 안 된다.
const POST_ITEM_HEIGHT = 120;
// 화면 높이를 재기 전 첫 렌더에 쓰는 높이(scrolloop 기본값과 같다)
const INITIAL_LIST_HEIGHT = 400;

export default function PostList({ category, type }: { category: Category; type: ProductType }) {
  const [refreshing, setRefreshing] = useState(false);
  // VirtualList는 height로 화면에 그릴 범위를 계산하고 높이도 그 값으로 고정한다. 넘기지 않으면
  // 화면 크기와 상관없이 400으로 고정돼 큰 화면에서 목록 아래가 비었다. 실제 영역을 재서 넘긴다.
  const [listHeight, setListHeight] = useState(0);
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

  // 차단 목록을 Set으로 만들어 두고 조회하면, 게시글마다 차단 목록 전체를 훑는 O(n*m)을 O(n+m)으로 줄일 수 있다.
  const blockedIds = useMemo(
    () => new Set<number | undefined>(blockList?.map((b) => b.memberId)),
    [blockList]
  );

  const data = useMemo(
    () => postsData.filter((post) => !blockedIds.has(post?.member?.memberId)),
    [postsData, blockedIds]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setListHeight((prev) => (prev === height ? prev : height));
  }, []);

  const renderItem = useCallback(
    (index: number, style: ViewStyle) => {
      const item = data[index];
      if (!item) return null;
      return (
        <View testID={`post-list-item-${index}`} style={style} className="overflow-hidden">
          <Post {...item} />
        </View>
      );
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
    <View testID="post-list" className="flex-1" onLayout={handleLayout}>
      <VirtualList
        height={listHeight > 0 ? listHeight : INITIAL_LIST_HEIGHT}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        itemSize={POST_ITEM_HEIGHT}
        overscan={12}
        count={data.length}
        renderItem={renderItem}
      />
    </View>
  );
}
