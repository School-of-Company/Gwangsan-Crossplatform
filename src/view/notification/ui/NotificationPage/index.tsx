import { FlatList, Text, RefreshControl } from 'react-native';
import { useGetAlertList } from '~/entity/notification';
import { NotificationItem } from '~/widget/notification';
import { Header } from '~/shared/ui';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePullToRefresh } from '~/shared/model/usePullToRefresh';
import { LoadingView } from '~/shared/ui/LoadingView';

const NotificationPage = () => {
  const { data: apiResponse, isLoading, error, refetch } = useGetAlertList();

  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const alerts = apiResponse ?? [];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header headerTitle="알림" />
        <LoadingView size="large" />
      </SafeAreaView>
    );
  }

  if (error || !apiResponse) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header headerTitle="알림" />
        <ErrorFallback title="알림을 불러오는데 실패했습니다." onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header headerTitle="알림" />
      <FlatList
        testID="notification-list"
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1 }}
        data={alerts}
        // 서버가 id를 내려주지 않는 알림만 index로 대체한다.
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item, index }) => (
          <NotificationItem
            id={item.id ?? index}
            title={item.title}
            content={item.content}
            alertType={item.alertType}
            createdAt={item.createdAt}
            sourceId={item.sourceId}
            images={item.images}
          />
        )}
        ListEmptyComponent={
          <Text testID="notification-empty" className="pt-20 text-center text-gray-500">
            새로운 알림이 없습니다.
          </Text>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default NotificationPage;
