import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { TermsStep } from '@/widget/signup';

export default function SignupTerms() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <TermsStep />
    </FeatureErrorBoundary>
  );
}
