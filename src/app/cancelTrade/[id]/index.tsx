import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import CancelTradeView from '~/view/cancelTrade/ui/CancelTradeView';

export default function CancelTradePage() {
  return (
    <FeatureErrorBoundary>
      <CancelTradeView />
    </FeatureErrorBoundary>
  );
}
