import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { ResetPasswordPage } from '~/view/resetPassword';

export default function ResetPasswordScreen() {
  return (
    <FeatureErrorBoundary featureName="ResetPassword">
      <ResetPasswordPage />
    </FeatureErrorBoundary>
  );
}
