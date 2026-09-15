import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { PasswordStep } from '@/widget/signin';

export default function SigninPassword() {
  return (
    <FeatureErrorBoundary featureName="Signin">
      <PasswordStep />
    </FeatureErrorBoundary>
  );
}
