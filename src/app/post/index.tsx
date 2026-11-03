import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { PostView } from '~/view/post';

export default function Post() {
  return (
    <FeatureErrorBoundary featureName="Post">
      <PostView />
    </FeatureErrorBoundary>
  );
}
