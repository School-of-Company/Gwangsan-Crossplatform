import { Stack, usePathname, useRouter } from 'expo-router';
import { AppState, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useRef } from 'react';
import { saveE2ECoverage } from '@/shared/lib/e2eCoverage';
import '../../global.css';
import { useCustomFonts } from '@/shared/assets/fonts/fontLoader';
import Toast from 'react-native-toast-message';
import QueryProvider from '../shared/lib/QueryProvider';
import '@/shared/lib/sentry';
import * as SentryRN from '@sentry/react-native';
import { useNetworkStatus } from '@/shared/lib/useNetworkStatus';
import { NoNetworkOverlay } from '@/shared/ui/NoNetworkOverlay';
import * as Notifications from 'expo-notifications';
import { AlertType } from '@/entity/notification';
import { useChatEntry } from '@/shared/lib/useChatEntry';
import { useGlobalChatNotifications } from '@/shared/lib/useGlobalChatNotifications';
import { registerChatBackgroundTask } from '@/shared/lib/chatBackgroundTask';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();
  const isConnected = useNetworkStatus();
  const pathname = usePathname();
  const router = useRouter();
  const { navigateToChat } = useChatEntry();
  const navigateToChatRef = useRef(navigateToChat);
  const routerRef = useRef(router);
  useGlobalChatNotifications();

  useEffect(() => {
    navigateToChatRef.current = navigateToChat;
  }, [navigateToChat]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    registerChatBackgroundTask();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        alertType?: AlertType;
        sourceId?: number;
        roomId?: number;
      };
      if (data?.alertType === AlertType.CHTTING_REQUEST && data?.sourceId != null) {
        navigateToChatRef.current(data.sourceId);
      } else if (data?.roomId != null) {
        routerRef.current.push(`/chatting/${data.roomId}`);
      } else if (data?.alertType === AlertType.TRADE_COMPLETE && data?.sourceId != null) {
        routerRef.current.push(`/post/${data.sourceId}?review=1`);
      } else if (data?.alertType === AlertType.REVIEW && data?.sourceId != null) {
        routerRef.current.push(`/cancelTrade/${data.sourceId}`);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') saveE2ECoverage();
      SentryRN.addBreadcrumb({
        category: 'app.lifecycle',
        message: `App state changed to ${state}`,
        level: 'info',
      });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    SentryRN.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${pathname}`,
      level: 'info',
    });
  }, [pathname]);

  if (!fontsLoaded) return null;
  return (
    <KeyboardProvider>
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
    </KeyboardProvider>
  );
}
