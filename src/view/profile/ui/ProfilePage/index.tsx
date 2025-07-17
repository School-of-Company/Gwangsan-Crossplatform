import { ScrollView, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Footer } from '~/shared/ui/Footer';
import { Gwangsan, Information, Light } from '~/entity/profile/ui';
import { Active, Introduce } from '~/widget/profile/ui';
import Toast from 'react-native-toast-message';
import { useGetPosts } from '../../model/useGetPosts';
import Post from '~/shared/ui/Post';
import { useGetProfile } from '../../model/useGetProfile';
import { useLocalSearchParams } from 'expo-router';
import { getData } from '~/shared/lib/getData';
import { Header } from '~/shared/ui';

export default function ProfilePageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [actualId, setActualId] = useState<string>('');
  const [isMe, setIsMe] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const memberId = await getData('memberId');
        const isMyProfile = id === memberId;

        setIsMe(isMyProfile);
        setActualId(isMyProfile ? memberId || '' : id || '');
        setIsInitialized(true);
      } catch (error) {
        console.error(error);
        setIsInitialized(true);
      }
    };

    if (id !== undefined) {
      initializeProfile();
    }
  }, [id]);

  if (!isInitialized) {
    return (
      <SafeAreaView className="android:pt-10 h-full bg-white">
        <Header headerTitle="프로필" />
        <View className="flex-1 items-center justify-center">
          <Text>프로필을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <ProfileContent actualId={actualId} isMe={isMe} />;
}

function ProfileContent({ actualId, isMe }: { actualId: string; isMe: boolean }) {
  const {
    data: profileData,
    error: profileError,
    isError: profileIsError,
  } = useGetProfile(actualId);
  const { data: postsData, error, isError } = useGetPosts(actualId);
  if (profileIsError) {
    Toast.show({
      type: 'error',
      text1: '프로필을 불러오는데 실패했습니다.',
      text2: profileError.message || '잠시 후 다시 시도해주세요.',
    });
    if (isError) {
      Toast.show({
        type: 'error',
        text1: '글을 불러오는데 실패했습니다.',
        text2: error.message || '잠시 후 다시 시도해주세요.',
      });
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="프로필" />
      <Information isMe={isMe} id={profileData?.memberId} name={profileData?.nickname} />
      <ScrollView className="flex-0.8 flex gap-3">
        <View className="bg-white pb-14">
          <Introduce introduce={profileData?.description} specialty={profileData?.specialties} />
          <Light lightLevel={profileData?.light} />
          {!isMe && <Gwangsan gwangsan={profileData?.gwangsan} />}
        </View>
        <Active id={actualId} isMe={isMe} />
        <View className="mt-3 flex gap-6 bg-white px-6 pb-9 pt-10">
          <Text className=" text-titleSmall">
            {isMe ? '내 글' : profileData?.nickname + '님의 글'}
          </Text>
          {postsData?.map((post) => {
            return <Post {...post} key={post.id} />;
          })}
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
