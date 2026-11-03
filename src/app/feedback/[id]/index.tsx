import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { FeedbackDetailPage } from '~/view/feedback';

export default function FeedbackDetail() {
  return (
    <FeatureErrorBoundary featureName="FeedbackDetail">
      <FeedbackDetailPage />
    </FeatureErrorBoundary>
  );
}
