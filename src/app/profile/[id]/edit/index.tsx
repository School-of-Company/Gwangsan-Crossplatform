import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ProfileEditPageView from '~/view/profile/ui/ProfileEditPage';

export default function ProfileEditPage() {
  return (
    <FeatureErrorBoundary>
      <ProfileEditPageView />
    </FeatureErrorBoundary>
  );
}
