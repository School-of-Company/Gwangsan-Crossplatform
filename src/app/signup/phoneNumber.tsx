import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { PhoneStep } from '@/widget/signup';

export default function SignupPhoneNumber() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <PhoneStep />
    </FeatureErrorBoundary>
  );
}
