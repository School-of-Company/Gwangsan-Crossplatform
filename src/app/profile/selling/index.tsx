import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import SellingPageView from '~/view/profile/ui/SellingPage';

export default function ProfileSellingPage() {
  return (
    <FeatureErrorBoundary featureName="ProfileSelling">
      <SellingPageView />
    </FeatureErrorBoundary>
  );
}
