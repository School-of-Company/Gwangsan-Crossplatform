import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SignupPage } from '@/view/signup';

export default function Signup() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <SignupPage />
    </FeatureErrorBoundary>
  );
}
