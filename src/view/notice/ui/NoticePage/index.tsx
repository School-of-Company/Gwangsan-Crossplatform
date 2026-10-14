import { FlatList, ScrollView, ActivityIndicator, Text, View, RefreshControl } from 'react-native';
import { NoticeItem } from '~/widget/notice';
import { Header } from '~/shared/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetNoticeList } from '~/entity/notice/model/useGetNoticeList';
import { useCallback, useState } from 'react';

const NoticePage = () => {
  const { data: noticeList, isLoading, error, refetch } = useGetNoticeList();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderContent = () => {
    if (isLoading && !noticeList) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8FC31D" />
        </View>
      );
    }

    if (error && !noticeList) {
      return (
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-1 items-center justify-center"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Text className="text-error-500">공지사항을 불러오는데 실패했습니다.</Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        testID="notice-list"
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1 }}
        data={noticeList ?? []}
        keyExtractor={(notice) => String(notice.id)}
        renderItem={({ item: notice }) => (
          <NoticeItem
            id={notice.id}
            title={notice.title}
            content={notice.content}
            images={notice.images}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle="공지" showBackButton={false} />
      {renderContent()}
    </SafeAreaView>
  );
};

export default NoticePage;
