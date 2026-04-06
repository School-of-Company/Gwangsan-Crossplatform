import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { OnboardingPage } from '~/view/onboarding';

export default function Onboarding() {
  return (
    <FeatureErrorBoundary>
      <OnboardingPage />
    </FeatureErrorBoundary>
  );
}
