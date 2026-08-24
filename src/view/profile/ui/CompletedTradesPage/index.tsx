import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Header } from '~/shared/ui';
import { CompletedTrades } from '~/widget/profile/ui';
import { useGetProfile } from '../../model/useGetProfile';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import { useGetPosts } from '../../model/useGetPosts';

export default function CompletedTradesPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);

  const { data: profileData } = useGetProfile(id);
  const { data: myProfileData } = useGetMyProfile(isMe);
  const { data: myPostsData, error: myPostsError, isError: myPostsIsError } = useGetMyPosts(isMe);
  const {
    data: otherPostsData,
    error: otherPostsError,
    isError: otherPostsIsError,
  } = useGetPosts(id);

  const postsData = isMe ? myPostsData : otherPostsData;
  const isError = isMe ? myPostsIsError : otherPostsIsError;
  const error = isMe ? myPostsError : otherPostsError;

  if (isError) {
    Toast.show({
      type: 'error',
      text1: '글을 불러오는데 실패했습니다.',
      text2: error?.message || '잠시 후 다시 시도해주세요.',
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="거래 내역" showBackButton />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <CompletedTrades
          posts={postsData}
          isMe={isMe}
          name={isMe ? myProfileData?.nickname : profileData?.nickname}
          showTitle={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
