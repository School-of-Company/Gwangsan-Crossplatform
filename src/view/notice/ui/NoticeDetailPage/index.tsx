import { View, Text, ScrollView, TouchableOpacity, Image} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { noticeListMock } from '@/widget/notice/mock/noticeDataMock';

const NoticeDetailPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const notice = noticeListMock.find(item => item.id === Number(id));

  if (!notice) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-500">공지사항을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const hasImages = notice.images && notice.images.length > 0;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-6 bg-white">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-4"
          >
            <Text className="text-blue-600 text-base">← 뒤로</Text>
          </TouchableOpacity>
        </View>
        {hasImages && (
          <View className="relative">
            <Image 
              source={{ uri: notice.images[0].imageUrl }}
              className="w-full h-64"
              resizeMode="cover"
            />
          </View>
        )}
        
        <View className="p-6 bg-white">
          <Text className="text-2xl font-bold text-black mb-2">
            {notice.title}
          </Text>
          
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base text-black">
              {notice.place}
            </Text>
            <Text className="text-sm text-black">
              {notice.createdAt}
            </Text>
          </View>
          
          <Text className="text-base text-black leading-6">
            {notice.content}
          </Text>
          
          {hasImages && notice.images.length > 1 && (
            <View className="mt-6">
              <Text className="text-lg font-semibold text-black mb-3">
                추가 이미지
              </Text>
              {notice.images.slice(1).map((image) => (
                <View key={image.imageId} className="mb-4">
                  <Image 
                    source={{ uri: image.imageUrl }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default NoticeDetailPage;
