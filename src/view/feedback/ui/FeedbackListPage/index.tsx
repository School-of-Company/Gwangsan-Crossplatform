import { useCallback } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Header } from '~/shared/ui';
import { FeedbackCard, useGetMyFeedbacks, type MyFeedbackResponse } from '~/entity/feedback';
import { Spinner } from '~/shared/ui/Spinner';

const keyExtractor = (item: MyFeedbackResponse) => String(item.feedbackId);

export default function FeedbackListPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    feedbacks,
    isPending,
    isError,
    isRefetching,
    isFetchingNextPage,
    isFetchNextPageError,
    loadMore,
    retryNextPage,
    refetch,
  } = useGetMyFeedbacks();

  const handleCardPress = useCallback(
    (feedbackId: number) => router.push(`/feedback/${feedbackId}`),
    [router]
  );

  const handleWritePress = useCallback(() => router.push('/feedback/write'), [router]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<MyFeedbackResponse>) => (
      <FeedbackCard feedback={item} onPress={handleCardPress} />
    ),
    [handleCardPress]
  );

  const renderEmpty = () => {
    if (isPending) {
      return (
        <View testID="feedback-list-loading" className="pt-20">
          <Spinner />
        </View>
      );
    }
    if (isError) {
      return (
        <Text className="pt-20 text-center text-error-500">
          문의 내역을 불러오지 못했습니다.{'\n'}아래로 당겨 다시 시도해주세요.
        </Text>
      );
    }
    return (
      <Text className="pt-20 text-center text-gray-500">
        아직 보낸 문의가 없습니다.{'\n'}불편한 점이나 의견을 보내주세요.
      </Text>
    );
  };

  const renderFooter = () => {
    if (isFetchNextPageError) {
      return (
        <TouchableOpacity
          testID="feedback-list-retry"
          onPress={() => retryNextPage()}
          className="items-center rounded-lg bg-gray-50 px-5 py-3">
          <Text className="text-label text-gray-700">
            더 불러오지 못했습니다. 다시 시도하려면 누르세요.
          </Text>
        </TouchableOpacity>
      );
    }
    if (isFetchingNextPage) {
      return (
        <View testID="feedback-list-loading-more" className="items-center py-4">
          <Spinner />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle="문의 내역" />
      <FlatList
        testID="feedback-list"
        data={feedbacks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />
      <View className="bg-background px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button onPress={handleWritePress}>문의하기</Button>
      </View>
    </SafeAreaView>
  );
}
