import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { report } from '~/entity/post/api/report';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { REPORT_TYPE_MAP } from '~/entity/post/model/reportType';
import MiniProfile from '~/entity/post/ui/miniProfile';
import ReportModal from '~/entity/post/ui/ReportModal';
import { Button, Header } from '~/shared/ui';
import Toast from 'react-native-toast-message';

export default function PostPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useGetItem(id);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [reportContents, setReportContents] = useState('');

  const handleReportPress = () => {
    setIsReportModalVisible(true);
  };

  const handleReportModalClose = () => {
    setIsReportModalVisible(false);
    setReportType(null);
    setReportContents('');
  };

  const handleReportSubmit = async (type: string, reason: string) => {
    if (!id || !data) return;
    
    const mappedReportType = REPORT_TYPE_MAP[type] || 'ETC';
    
    try {
      await report({
        productId: data.id,
        reportType: mappedReportType,
        content: reason,
      });
      handleReportModalClose();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '신고 제출 실패',
        text2: error as string,
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-error-500">게시글을 불러오는데 실패했습니다.</Text>
      </SafeAreaView>
    );
  }

  const headerTitle = data.mode === 'RECEIVER' ? '해주세요' : '해드립니다';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle={headerTitle} />
      <ScrollView>
        {data.images && data.images.length > 0 ? (
          <Image 
            source={{ uri: data.images[0].imageUrl }} 
            className="h-[280px] w-full" 
            resizeMode="cover"
          />
        ) : (
          <Image 
            source={require('~/shared/assets/png/logo.png')} 
            className="h-[280px] w-full" 
          />
        )}
        <MiniProfile 
          nickname={data.member.nickname}
          placeName={data.member.placeName}
          light={data.member.light}
        />
        <View className="gap-6 p-6">
          <Text className="text-titleSmall">{data.title}</Text>
          <Text className="text-body3">{data.gwangsan} 광산</Text>
          <Text>{data.content}</Text>
          <TouchableOpacity onPress={handleReportPress}>
            <Text className="mb-24 mt-[25px] text-error-500 underline">이 게시글 신고하기</Text>
          </TouchableOpacity>
          <View className="w-full flex-row justify-center gap-4">
            <Button variant="secondary" width="w-1/2">
              채팅하기
            </Button>
            <Button variant="primary" width="w-1/2">
              거래완료
            </Button>
          </View>
        </View>
      </ScrollView>

      <ReportModal
        isVisible={isReportModalVisible}
        onClose={handleReportModalClose}
        onSubmit={handleReportSubmit}
        reportType={reportType}
        contents={reportContents}
        onReportTypeChange={setReportType}
        onContentsChange={setReportContents}
      />
    </SafeAreaView>
  );
}
