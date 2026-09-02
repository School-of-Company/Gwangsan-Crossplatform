import { RefreshControl, Text, View } from 'react-native';
import Post from '~/shared/ui/Post';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';
import { useCallback, useMemo, useState } from 'react';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { useGetBlockList } from '~/entity/profile/model/useGetBlockList';
import { returnValue } from '~/view/post/model/handleCategory';
import { Category } from '~/view/post/model/category';
import { VirtualList } from 'scrolloop/native';

export default function PostList({ category, type }: { category: Category; type: ProductType }) {
  const [refreshing, setRefreshing] = useState(false);
  const currentMode = category ? returnValue(category) : undefined;

  const { data: postsData = [], refetch } = useGetPosts(
    currentMode as ModeType | undefined,
    type as ProductType | undefined
  );
  const { data: blockList } = useGetBlockList();

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
