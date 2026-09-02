import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import BlockedUsersPageView from '~/view/profile/ui/BlockedUsersPage';

export default function ProfileBlockedPage() {
  return (
    <FeatureErrorBoundary featureName="ProfileBlocked">
      <BlockedUsersPageView />
    </FeatureErrorBoundary>
  );
}
