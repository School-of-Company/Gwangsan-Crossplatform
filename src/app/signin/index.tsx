import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SigninPage } from '@/view/signin';

export default function Signin() {
  return (
    <FeatureErrorBoundary featureName="Signin">
      <SigninPage />
    </FeatureErrorBoundary>
  );
}
