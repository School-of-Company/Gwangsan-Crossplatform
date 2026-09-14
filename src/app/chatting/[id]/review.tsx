import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ReviewWritePage from '@/view/chat/ui/ReviewWritePage';

export default function Review() {
  return (
    <FeatureErrorBoundary featureName="ReviewWrite">
      <ReviewWritePage />
    </FeatureErrorBoundary>
  );
}
