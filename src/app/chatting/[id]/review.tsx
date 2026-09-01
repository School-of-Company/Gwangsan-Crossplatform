import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SlideFadeTransition } from '@/shared/ui/SlideFadeTransition';
import ReviewWritePage from '@/view/chat/ui/ReviewWritePage';

export default function Review() {
  return (
    <FeatureErrorBoundary featureName="ReviewWrite">
      <SlideFadeTransition direction="right">
        <ReviewWritePage />
      </SlideFadeTransition>
    </FeatureErrorBoundary>
  );
}
