import { FlatList, ActivityIndicator, Text, View, RefreshControl } from 'react-native';
import { useGetAlertList } from '~/entity/notification';
import NotificationItem from '~/widget/notification/ui/NotificationItem';
import { Header } from '~/shared/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';

const NotificationPage = () => {
  const { data: apiResponse, isLoading, error, refetch } = useGetAlertList();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const alerts = apiResponse ?? [];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header headerTitle="알림" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8FC31D" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !apiResponse) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header headerTitle="알림" />
        <View className="flex-1 items-center justify-center">
          <Text>알림을 불러오는데 실패했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
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
            raw={item}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default NotificationPage;
