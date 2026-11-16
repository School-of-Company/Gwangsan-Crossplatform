import { ActivityIndicatorProps, View } from 'react-native';
import { Spinner } from '../Spinner';

interface LoadingViewProps {
  size?: ActivityIndicatorProps['size'];
  testID?: string;
}

export function LoadingView({ size, testID }: LoadingViewProps) {
  return (
    <View testID={testID} className="flex-1 items-center justify-center">
      <Spinner size={size} />
    </View>
  );
}
