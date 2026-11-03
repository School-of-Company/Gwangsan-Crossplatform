import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ReviewsPageView } from '~/view/reviews';

export default function PostPage() {
  return (
    <FeatureErrorBoundary featureName="ReviewsDetail">
      <ReviewsPageView mode="receive" />
    </FeatureErrorBoundary>
  );
}
