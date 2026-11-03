import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ReservationLocationPage } from '~/view/chat';

export default function ReservationLocation() {
  return (
    <FeatureErrorBoundary featureName="ReservationLocation">
      <ReservationLocationPage />
    </FeatureErrorBoundary>
  );
}
