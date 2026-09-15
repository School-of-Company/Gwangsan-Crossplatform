import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { NicknameStep } from '@/widget/signin';

export default function SigninNickname() {
  return (
    <FeatureErrorBoundary featureName="Signin">
      <NicknameStep />
    </FeatureErrorBoundary>
  );
}
