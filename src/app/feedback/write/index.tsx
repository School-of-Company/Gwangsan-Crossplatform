import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { FeedbackWritePage } from '~/view/feedback';

export default function FeedbackWrite() {
  return (
    <FeatureErrorBoundary featureName="Feedback">
      <FeedbackWritePage />
    </FeatureErrorBoundary>
  );
}
