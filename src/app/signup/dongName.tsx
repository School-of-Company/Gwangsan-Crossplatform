import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { DongStep } from '@/widget/signup';

export default function SignupDongName() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <DongStep />
    </FeatureErrorBoundary>
  );
}
