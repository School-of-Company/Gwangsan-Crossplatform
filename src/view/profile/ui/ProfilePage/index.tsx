import { ScrollView, Text, View, RefreshControl } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Footer } from '~/shared/ui/Footer';
import { Gwangsan, Information, Light } from '~/entity/profile/ui';
import { Active, Introduce } from '~/widget/profile/ui';
import Toast from 'react-native-toast-message';
import { useGetPosts } from '../../model/useGetPosts';
import Post from '~/shared/ui/Post';
import { useGetProfile } from '../../model/useGetProfile';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '~/shared/ui';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';

export default function ProfilePageView() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: profileData,
    error: profileError,
    isError: profileIsError,
    refetch: refetchProfile,
  } = useGetProfile(id);

  const isMe = !Boolean(id);

  const { data: myProfileData, refetch: refetchMyProfile } = useGetMyProfile(isMe);

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
  } = useGetPosts(id);

  const postsData = isMe ? myPostsData : otherPostsData;
  const error = isMe ? myPostsError : otherPostsError;
  const isError = isMe ? myPostsIsError : otherPostsIsError;
  const refetchPosts = isMe ? refetchMyPosts : refetchOtherPosts;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPosts(), isMe ? refetchMyProfile() : refetchProfile()]);
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
      <Information
        isMe={isMe}
        id={isMe ? myProfileData?.memberId : profileData?.memberId}
        name={isMe ? myProfileData?.nickname : profileData?.nickname}
      />
      <ScrollView
        className="flex-0.8 flex gap-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="bg-white pb-14">
          <Introduce
            introduce={isMe ? myProfileData?.description : profileData?.description}
            specialty={isMe ? myProfileData?.specialties : profileData?.specialties}
          />
          <Light lightLevel={isMe ? myProfileData?.light : profileData?.light} />
          {isMe && <Gwangsan gwangsan={myProfileData?.gwangsan} />}
        </View>
        <Active
          name={isMe ? myProfileData?.nickname : profileData?.nickname}
          id={String(isMe ? myProfileData?.memberId : profileData?.memberId)}
          isMe={isMe}
        />
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
