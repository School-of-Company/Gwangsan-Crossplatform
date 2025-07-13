import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '~/shared/ui';
import { NoticeDetailSlideViewer } from '~/widget/notice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetNoticeDetail } from '~/entity/notice/model/useGetNoticeDetail';

const NoticeDetailPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isLoading, error } = useGetNoticeDetail(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header headerTitle="공지" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8FC31D" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !notice) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header headerTitle="공지" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-error-500">공지사항을 불러오는데 실패했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasImages = notice.images && notice.images.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <Header headerTitle="공지" />
        {hasImages && <NoticeDetailSlideViewer notice={notice} />}

        <View className="bg-white p-6">
          <Text className="mb-2 text-2xl font-bold text-black">{notice.title}</Text>

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base text-black">{notice.place || ''}</Text>
            <Text className="text-sm text-black">{notice.createdAt || ''}</Text>
          </View>

          <Text className="text-base leading-6 text-black">{notice.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NoticeDetailPage;
