import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { NoticePage } from '~/view/notice';

export default function Notice() {
  return (
    <FeatureErrorBoundary featureName="Notice">
      <NoticePage />
    </FeatureErrorBoundary>
  );
}
