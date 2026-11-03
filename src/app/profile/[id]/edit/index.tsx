import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ProfileEditPageView } from '~/view/profile';

export default function ProfileEditPage() {
  return (
    <FeatureErrorBoundary featureName="ProfileEdit">
      <ProfileEditPageView />
    </FeatureErrorBoundary>
  );
}
