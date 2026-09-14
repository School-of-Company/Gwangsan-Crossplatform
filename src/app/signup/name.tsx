import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { NameStep } from '@/widget/signup';

export default function SignupName() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <NameStep />
    </FeatureErrorBoundary>
  );
}
