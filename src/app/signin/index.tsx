import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SigninPage } from '@/view/signin';

export default function Signin() {
  return (
    <FeatureErrorBoundary>
      <SigninPage />
    </FeatureErrorBoundary>
  );
}
