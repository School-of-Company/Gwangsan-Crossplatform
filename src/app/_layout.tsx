import { Stack } from 'expo-router';
import { View } from 'react-native';
import '../../global.css';
import { useCustomFonts } from '@/shared/assets/fonts/fontLoader';
import Toast from 'react-native-toast-message';
import QueryProvider from '../shared/lib/QueryProvider';
import '@/shared/lib/sentry';
import * as SentryRN from '@sentry/react-native';

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();
  if (!fontsLoaded) return null;
  return (
    <View className="mb-6 flex-1 bg-white">
      <QueryProvider>
        <SentryRN.ErrorBoundary fallback={<></>}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          />
        </SentryRN.ErrorBoundary>
        <Toast />
      </QueryProvider>
    </View>
  );
}
