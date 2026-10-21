import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import FeedbackPage from '~/view/feedback/ui/FeedbackPage';

export default function Feedback() {
  return (
    <FeatureErrorBoundary featureName="Feedback">
      <FeedbackPage />
    </FeatureErrorBoundary>
  );
}
