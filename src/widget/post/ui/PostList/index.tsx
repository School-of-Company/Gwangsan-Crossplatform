import { RefreshControl } from 'react-native';
import Post from '~/shared/ui/Post';
import { useLocalSearchParams } from 'expo-router';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';
import { useCallback, useState } from 'react';
import { useGetPosts } from '~/shared/model/useGetPosts';
import { returnValue } from '~/view/post/model/handleCategory';
import { Category } from '~/view/post/model/category';
import { VirtualList } from 'scrolloop/native';

export default function PostList({ category }: { category: Category }) {
  const { type } = useLocalSearchParams<{ type: ProductType; mode?: ModeType }>();

  const [refreshing, setRefreshing] = useState(false);
  const currentMode = category ? returnValue(category) : undefined;

  const { data = [], refetch } = useGetPosts(
    currentMode as ModeType | undefined,
    type as ProductType | undefined
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <VirtualList
      decelerationRate={0}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      itemSize={120}
      overscan={12}
      count={data.length}
      renderItem={(index) => {
        const item = data[index];
        if (!item) return null;

        return <Post {...item} />;
      }}
    />
  );
}
