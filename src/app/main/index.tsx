import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import MainPageView from '~/view/main/ui/MainPage';

export default function Main() {
  return (
    <FeatureErrorBoundary>
      <MainPageView />
    </FeatureErrorBoundary>
  );
}
