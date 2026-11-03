import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { PostPageView } from '~/view/post';

export default function PostPage() {
  return (
    <FeatureErrorBoundary featureName="PostDetail">
      <PostPageView />
    </FeatureErrorBoundary>
  );
}
