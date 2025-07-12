import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Footer } from '~/shared/ui/Footer';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { Gwangsan, Information, Light } from '~/entity/profile/ui';
import { Active, Introduce } from '~/widget/profile/ui';
import Toast from 'react-native-toast-message';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import Post from '~/shared/ui/Post';

export default function ProfilePageView() {
  const { data: MyProfileData, error, isError } = useGetMyProfile();
  const { data: MyPostsData } = useGetMyPosts();
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
      <Information id={MyProfileData?.memberId} name={MyProfileData?.nickname} />
      <ScrollView className=" flex-0.8 flex gap-3">
        <View className="bg-white pb-14">
          <Introduce
            introduce={MyProfileData?.description}
            specialty={MyProfileData?.specialties}
          />
          <Light lightLevel={MyProfileData?.light} />
          <Gwangsan gwangsan={MyProfileData?.gwangsan} />
        </View>
        <Active />
        <View className="mt-3 flex gap-6 bg-white px-6 pb-9 pt-10">
          <Text className=" text-titleSmall">내 글</Text>
          {MyPostsData?.map((post) => {
            return <Post {...post} key={post.id} />;
          })}
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
