import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import PostView from '~/view/post/ui/PostView';

export default function Post() {
  return (
    <FeatureErrorBoundary featureName="Post">
      <PostView />
    </FeatureErrorBoundary>
  );
}
