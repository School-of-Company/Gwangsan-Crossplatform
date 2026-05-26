import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import PostPageView from '~/view/post/ui/PostPage';

export default function PostPage() {
  return (
    <FeatureErrorBoundary featureName="PostDetail">
      <PostPageView />
    </FeatureErrorBoundary>
  );
}
