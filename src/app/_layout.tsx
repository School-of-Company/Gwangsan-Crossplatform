import { Stack } from 'expo-router';
import { AppState, View } from 'react-native';
import { useEffect } from 'react';
import { saveE2ECoverage } from '@/shared/lib/e2eCoverage';
import '../../global.css';
import { useCustomFonts } from '@/shared/assets/fonts/fontLoader';
import Toast from 'react-native-toast-message';
import QueryProvider from '../shared/lib/QueryProvider';
import '@/shared/lib/sentry';
import * as SentryRN from '@sentry/react-native';
import { useNetworkStatus } from '@/shared/lib/useNetworkStatus';
import { NoNetworkOverlay } from '@/shared/ui/NoNetworkOverlay';

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();
  const isConnected = useNetworkStatus();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') void saveE2ECoverage();
    });
    return () => sub.remove();
  }, []);

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
        <NoNetworkOverlay visible={!isConnected} />
      </QueryProvider>
    </View>
  );
}
