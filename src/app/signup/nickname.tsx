import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { NicknameStep } from '@/widget/signup';

export default function SignupNickname() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <NicknameStep />
    </FeatureErrorBoundary>
  );
}
