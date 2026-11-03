import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ReservationMapPage } from '~/view/chat';

export default function ReservationMap() {
  return (
    <FeatureErrorBoundary featureName="ReservationMap">
      <ReservationMapPage />
    </FeatureErrorBoundary>
  );
}
