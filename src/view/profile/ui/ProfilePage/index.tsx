import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Footer } from '~/shared/ui/Footer';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { Gwangsan, Information, Light } from '~/entity/profile/ui';
import { Active, ReviewList } from '~/widget/profile/ui';
import Toast from 'react-native-toast-message';
import Introduce from '~/widget/profile/ui/Introduce';

export default function ProfilePageView() {
  const { data, error, isError } = useGetMyProfile();
  if (isError) {
    Toast.show({
      type: 'error',
      text1: '프로필을 불러오는데 실패했습니다.',
      text2: error.message || '잠시 후 다시 시도해주세요.',
    });
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex w-full flex-row justify-between bg-white px-6 py-6 text-center">
        <View className="size-6"></View>
        <Text className="text-body1">프로필</Text>
        <Ionicons name="close" color="#8F9094" size={24} />
      </View>
      <Information id={data?.memberId} name={data?.nickname} />
      <ScrollView className=" flex-0.8 flex gap-3">
        <View className="bg-white pb-14">
          <Introduce introduce={data?.description} specialty={data?.specialties} />
          <Light lightLevel={data?.light} />
          <Gwangsan gwangsan={data?.gwangsan} />
        </View>
        <Active />
        <ReviewList />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
