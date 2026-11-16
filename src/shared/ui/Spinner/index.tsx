import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { useThemeColors } from '~/shared/lib/theme';

export function Spinner(props: Omit<ActivityIndicatorProps, 'color'>) {
  const { main } = useThemeColors();
  return <ActivityIndicator color={main} {...props} />;
}
