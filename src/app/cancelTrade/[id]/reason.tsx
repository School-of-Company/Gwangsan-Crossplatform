import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import CancelTradeReasonPage from '~/view/cancelTrade/ui/CancelTradeReasonPage';

export default function CancelTradeReason() {
  return (
    <FeatureErrorBoundary featureName="CancelTradeReason">
      <CancelTradeReasonPage />
    </FeatureErrorBoundary>
  );
}
