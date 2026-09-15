import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { PasswordStep } from '@/widget/signup';

export default function SignupPassword() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <PasswordStep />
    </FeatureErrorBoundary>
  );
}
