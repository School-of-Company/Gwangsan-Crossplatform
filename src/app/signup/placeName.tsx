import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { PlaceStep } from '@/widget/signup';

export default function SignupPlaceName() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <PlaceStep />
    </FeatureErrorBoundary>
  );
}
