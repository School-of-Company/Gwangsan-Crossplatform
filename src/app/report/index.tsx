import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ReportPage } from '~/view/report';

export default function Report() {
  return (
    <FeatureErrorBoundary featureName="Report">
      <ReportPage />
    </FeatureErrorBoundary>
  );
}
