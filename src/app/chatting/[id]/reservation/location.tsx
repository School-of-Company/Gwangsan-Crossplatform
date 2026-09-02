import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SlideFadeTransition } from '@/shared/ui/SlideFadeTransition';
import { ReservationLocationPage } from '@/view/chat/ui/ReservationLocationPage';

export default function ReservationLocation() {
  return (
    <FeatureErrorBoundary featureName="ReservationLocation">
      <SlideFadeTransition direction="right">
        <ReservationLocationPage />
      </SlideFadeTransition>
    </FeatureErrorBoundary>
  );
}
