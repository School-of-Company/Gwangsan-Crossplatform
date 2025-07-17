import { ScrollView, ActivityIndicator, Text, View } from 'react-native';
// import { useGetAlertList } from '~/entity/notification';
import NotificationItem from '~/widget/notification/ui/NotificationItem';
import { Header } from '~/shared/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationDataMock } from '~/widget/notification/mock/notificationDataMock';

const NotificationPage = () => {
  // const { data: alertResponse, isLoading, error } = useGetAlertList();

  const alertResponse = notificationDataMock;
  const isLoading = false;
  const error = null;

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

  if (error || !alertResponse) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header headerTitle="알림" />
        <View className="flex-1 items-center justify-center">
          <Text>알림을 불러오는데 실패했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const alerts = alertResponse.alert || [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="알림" />
      <ScrollView className="flex-1 px-4 py-4">
        {alerts.map((alert) => (
          <NotificationItem
            key={alert.id}
            id={alert.id}
            title={alert.title}
            content={alert.content}
            alertType={alert.alert_type}
            imageIds={alert.imageIds}
            createdAt={alert.createdAt}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationPage;
