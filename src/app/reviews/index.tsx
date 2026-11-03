import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ReviewsPageView } from '~/view/reviews';

export default function PostPage() {
  return (
    <FeatureErrorBoundary featureName="Reviews">
      <ReviewsPageView mode="toss" />
    </FeatureErrorBoundary>
  );
}
