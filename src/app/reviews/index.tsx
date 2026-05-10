import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ReviewsPageView from '~/view/reviews/ui/PostsPage';

export default function PostPage() {
  return (
    <FeatureErrorBoundary featureName="Reviews">
      <ReviewsPageView />
    </FeatureErrorBoundary>
  );
}
