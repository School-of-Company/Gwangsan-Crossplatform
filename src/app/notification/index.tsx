import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { NotificationPage } from '~/view/notification';

export default function Notification() {
  return (
    <FeatureErrorBoundary featureName="Notification">
      <NotificationPage />
    </FeatureErrorBoundary>
  );
}
