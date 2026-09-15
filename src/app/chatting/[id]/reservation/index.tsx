import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ReservationPage from '@/view/chat/ui/ReservationPage';

export default function Reservation() {
  return (
    <FeatureErrorBoundary featureName="Reservation">
      <ReservationPage />
    </FeatureErrorBoundary>
  );
}
