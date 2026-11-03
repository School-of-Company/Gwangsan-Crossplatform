import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { CancelTradeReasonPage } from '~/view/cancelTrade';

export default function CancelTradeReason() {
  return (
    <FeatureErrorBoundary featureName="CancelTradeReason">
      <CancelTradeReasonPage />
    </FeatureErrorBoundary>
  );
}
