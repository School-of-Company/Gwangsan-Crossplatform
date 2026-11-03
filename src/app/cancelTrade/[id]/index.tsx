import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { CancelTradeView } from '~/view/cancelTrade';

export default function CancelTradePage() {
  return (
    <FeatureErrorBoundary featureName="CancelTrade">
      <CancelTradeView />
    </FeatureErrorBoundary>
  );
}
