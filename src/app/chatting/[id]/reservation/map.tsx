import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { ReservationMapPage } from '@/view/chat/ui/ReservationMapPage';

export default function ReservationMap() {
  return (
    <FeatureErrorBoundary featureName="ReservationMap">
      <ReservationMapPage />
    </FeatureErrorBoundary>
  );
}
