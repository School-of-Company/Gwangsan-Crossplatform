import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { FeedbackListPage } from '~/view/feedback';

export default function FeedbackList() {
  return (
    <FeatureErrorBoundary featureName="FeedbackList">
      <FeedbackListPage />
    </FeatureErrorBoundary>
  );
}
