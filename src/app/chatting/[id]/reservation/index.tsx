import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SlideFadeTransition } from '@/shared/ui/SlideFadeTransition';
import ReservationPage from '@/view/chat/ui/ReservationPage';

export default function Reservation() {
  return (
    <FeatureErrorBoundary featureName="Reservation">
      <SlideFadeTransition direction="right">
        <ReservationPage />
      </SlideFadeTransition>
    </FeatureErrorBoundary>
  );
}
