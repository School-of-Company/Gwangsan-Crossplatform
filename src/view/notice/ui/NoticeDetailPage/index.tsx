import { View, Text, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { noticeListMock } from '@/widget/notice/mock/noticeDataMock';
import { Header } from '@/shared/ui';
import { NoticeDetailSlideViewer } from '@/widget/notice';

const NoticeDetailPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const notice = noticeListMock.find((item) => item.id === Number(id));

  if (!notice) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-lg text-gray-500">공지사항을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const hasImages = notice.images && notice.images.length > 0;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <Header headerTitle="공지" />
        {hasImages && <NoticeDetailSlideViewer notice={notice} />}

        <View className="bg-white p-6">
          <Text className="mb-2 text-2xl font-bold text-black">{notice.title}</Text>

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base text-black">{notice.place}</Text>
            <Text className="text-sm text-black">{notice.createdAt}</Text>
          </View>

          <Text className="text-base leading-6 text-black">{notice.content}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default NoticeDetailPage;
