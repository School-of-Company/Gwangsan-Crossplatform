import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ItemFormPage } from '~/view/write';

export default function Write() {
  return (
    <FeatureErrorBoundary featureName="Write">
      <ItemFormPage />
    </FeatureErrorBoundary>
  );
}
