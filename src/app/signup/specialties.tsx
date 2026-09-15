import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SpecialtiesStep } from '@/widget/signup';

export default function SignupSpecialties() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <SpecialtiesStep />
    </FeatureErrorBoundary>
  );
}
