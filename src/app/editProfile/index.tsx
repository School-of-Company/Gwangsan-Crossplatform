import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import EditProfilePageView from '~/view/editProfile/ui/editProfilePage';

export default function EditProfile() {
  return (
    <FeatureErrorBoundary featureName="EditProfile">
      <EditProfilePageView />
    </FeatureErrorBoundary>
  );
}
