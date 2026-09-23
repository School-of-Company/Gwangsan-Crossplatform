import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ReportPage from '~/view/report/ui/ReportPage';

export default function Report() {
  return (
    <FeatureErrorBoundary featureName="Report">
      <ReportPage />
    </FeatureErrorBoundary>
  );
}
