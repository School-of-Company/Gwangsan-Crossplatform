import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { DescriptionStep } from '@/widget/signup';

export default function SignupDescription() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <DescriptionStep />
    </FeatureErrorBoundary>
  );
}
