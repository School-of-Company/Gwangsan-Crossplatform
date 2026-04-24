import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ProfilePageView from '~/view/profile/ui/ProfilePage';

export default function ProfilePage() {
  return (
    <FeatureErrorBoundary featureName="Profile">
      <ProfilePageView />
    </FeatureErrorBoundary>
  );
}
