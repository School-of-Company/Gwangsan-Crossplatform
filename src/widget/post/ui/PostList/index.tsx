import { ScrollView } from 'react-native';
import Post from '~/shared/ui/Post';
import { PostType } from '~/shared/types/postType';

interface PostListProps {
  posts?: PostType[];
}

export default function PostList({ posts = [] }: PostListProps) {
  return (
    <ScrollView>
      {posts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </ScrollView>
  );
}
