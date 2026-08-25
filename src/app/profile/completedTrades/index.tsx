import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import CompletedTradesPageView from '~/view/profile/ui/CompletedTradesPage';

export default function ProfileCompletedTradesPage() {
  return (
    <FeatureErrorBoundary featureName="ProfileCompletedTrades">
      <CompletedTradesPageView />
    </FeatureErrorBoundary>
  );
}
