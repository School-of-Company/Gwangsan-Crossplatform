import { ScrollView, ActivityIndicator, Text, View } from 'react-native';
import { useGetAlertList } from '~/entity/notification';
import NotificationItem from '~/widget/notification/ui/NotificationItem';
import { Header } from '~/shared/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationPage = () => {
  const { data: apiResponse, isLoading, error } = useGetAlertList();

  const alerts = Array.isArray(apiResponse) ? apiResponse : (apiResponse?.alert ?? []);

  const convertedAlerts = alerts.map((alert: any) => ({
    id: alert.id,
    title: alert.title,
    content: alert.content,
    alert_type: alert.alertType ?? alert.alert_type,
    imageIds: alert.images?.map((img: any) => img.imageId) ?? alert.imageIds ?? [],
    createdAt: alert.createdAt,
    sendMemberId: alert.sendMemberId,
    images: alert.images ?? [],
    raw: alert,
  }));

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
      <ScrollView className="flex-1 px-4 py-4">
        {convertedAlerts.map((alert) => (
          <NotificationItem
            key={alert.id}
            id={alert.id}
            title={alert.title}
            content={alert.content}
            alertType={alert.alert_type}
            imageIds={alert.imageIds}
            createdAt={alert.createdAt}
            sendMemberId={alert.sendMemberId}
            images={alert.images}
            raw={alert}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationPage;
