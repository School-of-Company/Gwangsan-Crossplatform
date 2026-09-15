import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { RecommenderStep } from '@/widget/signup';

export default function SignupRecommender() {
  return (
    <FeatureErrorBoundary featureName="Signup">
      <RecommenderStep />
    </FeatureErrorBoundary>
  );
}
