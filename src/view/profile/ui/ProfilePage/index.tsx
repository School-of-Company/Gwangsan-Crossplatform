import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Light from '~/entity/profile/ui/\bLight/\bindex';
import Gwangsan from '~/entity/profile/ui/Gwangsan';
import Information from '~/entity/profile/ui/Information';
import { Footer } from '~/shared/ui/Footer';
import Active from '~/widget/profile/ui/Active';
import ReviewList from '~/widget/profile/ui/reviewList';

export default function ProfilePageView() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex w-full flex-row justify-between bg-white px-6 py-6 text-center">
        <View className="size-6"></View>
        <Text className="text-body1">프로필</Text>
        <Ionicons name="close" color="#8F9094" size={24} />
      </View>
      <Information />
      <ScrollView className=" flex-0.8 flex gap-3">
        <View className="bg-white pb-14">
          <Light />
          <Gwangsan />
        </View>
        <Active />
        <ReviewList />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
