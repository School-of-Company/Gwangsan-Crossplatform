import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { Complete } from '@/widget/signup';

export default function SignupComplete() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <Complete />
    </FeatureErrorBoundary>
  );
}
