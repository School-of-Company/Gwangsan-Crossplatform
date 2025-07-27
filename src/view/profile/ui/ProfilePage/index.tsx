import { ScrollView, Text, View, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Footer } from '~/shared/ui/Footer';
import { Gwangsan, Information, Light } from '~/entity/profile/ui';
import { Active, Introduce } from '~/widget/profile/ui';
import Toast from 'react-native-toast-message';
import { useGetPosts } from '../../model/useGetPosts';
import Post from '~/shared/ui/Post';
import { useGetProfile } from '../../model/useGetProfile';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '~/shared/ui';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import { getCurrentUserId } from '~/shared/lib/getCurrentUserId';

export default function ProfilePageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [actualId, setActualId] = useState<string>('');
  const [isMe, setIsMe] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const currentUserId = await getCurrentUserId();
        const isMyProfile = id === currentUserId.toString();

        setIsMe(isMyProfile);
        setActualId(isMyProfile ? currentUserId.toString() : id || '');
        setIsInitialized(true);
      } catch (error) {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: '다시 로그인해 주세요.',
          text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
          visibilityTime: 2000,
        });
        router.replace('/onboarding');
      }
    };

    if (id !== undefined) {
      initializeProfile();
    }
  }, [id, router]);

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

  const { data: myProfileData } = useGetMyProfile(isMe);

  const {
    data: myPostsData,
    error: myPostsError,
    isError: myPostsIsError,
    refetch: refetchMyPosts,
  } = useGetMyPosts(isMe);

  const {
    data: otherPostsData,
    error: otherPostsError,
    isError: otherPostsIsError,
    refetch: refetchOtherPosts,
  } = useGetPosts(actualId);

  const postsData = isMe ? myPostsData : otherPostsData;
  const error = isMe ? myPostsError : otherPostsError;
  const isError = isMe ? myPostsIsError : otherPostsIsError;
  const refetchPosts = isMe ? refetchMyPosts : refetchOtherPosts;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchPosts();
    } finally {
      setRefreshing(false);
    }
  };

  if (profileIsError) {
    Toast.show({
      type: 'error',
      text1: '프로필을 불러오는데 실패했습니다.',
      text2: profileError.message || '잠시 후 다시 시도해주세요.',
    });
  }

  if (isError) {
    Toast.show({
      type: 'error',
      text1: '글을 불러오는데 실패했습니다.',
      text2: error?.message || '잠시 후 다시 시도해주세요.',
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="프로필" />
      <Information isMe={isMe} id={profileData?.memberId} name={profileData?.nickname} />
      <ScrollView
        className="flex-0.8 flex gap-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="bg-white pb-14">
          <Introduce introduce={profileData?.description} specialty={profileData?.specialties} />
          <Light lightLevel={profileData?.light} />
          {isMe && <Gwangsan gwangsan={myProfileData?.gwangsan} />}
        </View>
        <Active name={profileData?.nickname} id={actualId} isMe={isMe} />
        <View className="mt-3 flex gap-6 bg-white px-6 pb-9 pt-10">
          <Text className=" text-titleSmall">
            {isMe ? '내 글' : `${profileData?.nickname}님의 글`}
          </Text>
          {Array.isArray(postsData) && postsData.map((post) => <Post {...post} key={post.id} />)}
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
