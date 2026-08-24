import { Text, View } from 'react-native';
import { PostType } from '~/shared/types/postType';
import Post from '~/shared/ui/Post';

interface CompletedTradesProps {
  posts?: PostType[];
  isMe: boolean;
  name?: string;
}

export default function CompletedTrades({ posts = [], isMe, name }: CompletedTradesProps) {
  const completedPosts = posts.filter((post) => post.isCompleted);

  return (
    <View className="mt-3 flex gap-6 bg-white px-6 pb-9 pt-10">
      <Text className="text-titleSmall">
        {isMe ? '거래 완료 품목' : `${name ?? ''}님의 거래 완료 품목`}
      </Text>
      {completedPosts.length > 0 ? (
        completedPosts.map((post) => <Post {...post} key={post.id} />)
      ) : (
        <Text className="text-center text-gray-500">거래 완료된 품목이 없습니다.</Text>
      )}
    </View>
  );
}
