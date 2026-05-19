import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { NoticeDetailPage } from '~/view/notice';

export default function Notice() {
  return (
    <FeatureErrorBoundary featureName="NoticeDetail">
      <NoticeDetailPage />
    </FeatureErrorBoundary>
  );
}
