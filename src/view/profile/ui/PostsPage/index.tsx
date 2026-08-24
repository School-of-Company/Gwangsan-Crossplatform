import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Header } from '~/shared/ui';
import Post from '~/shared/ui/Post';
import { useGetProfile } from '../../model/useGetProfile';
import { useGetMyPosts } from '../../model/useGetMyPosts';
import { useGetPosts } from '../../model/useGetPosts';

export default function PostsPageView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isMe = !Boolean(id);

  const { data: profileData } = useGetProfile(id);
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
      <Header
        headerTitle={isMe ? '내 글' : `${profileData?.nickname ?? ''}님의 글`}
        showBackButton
      />
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {Array.isArray(postsData) && postsData.length > 0 ? (
          <View className="gap-6 pb-9">
            {postsData.map((post) => (
              <Post {...post} key={post.id} />
            ))}
          </View>
        ) : (
          <Text className="pt-20 text-center text-gray-500">게시물이 없습니다.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
