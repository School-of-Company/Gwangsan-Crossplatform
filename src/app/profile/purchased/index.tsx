import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { PurchasedPageView } from '~/view/profile';

export default function ProfilePurchasedPage() {
  return (
    <FeatureErrorBoundary featureName="ProfilePurchased">
      <PurchasedPageView />
    </FeatureErrorBoundary>
  );
}
