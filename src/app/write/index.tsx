import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ItemFormPage from '~/view/write/itemForm/ui/ItemFormPage';

export default function Write() {
  return (
    <FeatureErrorBoundary>
      <ItemFormPage />
    </FeatureErrorBoundary>
  );
}
