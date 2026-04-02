import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ReviewsPageView from '~/view/reviews/ui/PostsPage';

export default function PostPage() {
  return (
    <FeatureErrorBoundary>
      <ReviewsPageView />
    </FeatureErrorBoundary>
  );
}
