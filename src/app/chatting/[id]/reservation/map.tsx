import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SlideFadeTransition } from '@/shared/ui/SlideFadeTransition';
import { ReservationMapPage } from '@/view/chat/ui/ReservationMapPage';

export default function ReservationMap() {
  return (
    <FeatureErrorBoundary featureName="ReservationMap">
      <SlideFadeTransition direction="right">
        <ReservationMapPage />
      </SlideFadeTransition>
    </FeatureErrorBoundary>
  );
}
