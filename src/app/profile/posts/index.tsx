import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import PostsPageView from '~/view/profile/ui/PostsPage';

export default function ProfilePostsPage() {
  return (
    <FeatureErrorBoundary featureName="ProfilePosts">
      <PostsPageView />
    </FeatureErrorBoundary>
  );
}
