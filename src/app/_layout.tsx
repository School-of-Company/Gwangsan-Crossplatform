import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useRef } from 'react';
import { saveE2ECoverage } from '@/shared/lib/e2eCoverage';
import '../../global.css';
import { useCustomFonts } from '@/shared/assets/fonts/fontLoader';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/shared/ui/Toast';
import QueryProvider from '../shared/lib/QueryProvider';
import '@/shared/lib/sentry';
import * as SentryRN from '@sentry/react-native';
import { useNetworkStatus } from '@/shared/lib/useNetworkStatus';
import { NoNetworkOverlay } from '@/shared/ui/NoNetworkOverlay';
import { BottomSheetPortalOutlet } from '@/shared/ui/BottomSheetPortalOutlet';
import * as Notifications from 'expo-notifications';
import { AlertType } from '@/entity/notification';
import { useChatEntry } from '@/shared/lib/useChatEntry';
import { useGlobalChatNotifications } from '@/shared/lib/useGlobalChatNotifications';
import { registerChatBackgroundTask } from '@/shared/lib/chatBackgroundTask';

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function ChatNotificationHandler() {
  const router = useRouter();
  const { navigateToChat, navigateToRoom } = useChatEntry();
  const navigateToChatRef = useRef(navigateToChat);
  const navigateToRoomRef = useRef(navigateToRoom);
  const routerRef = useRef(router);
  useGlobalChatNotifications();

  useEffect(() => {
    navigateToChatRef.current = navigateToChat;
  }, [navigateToChat]);

  useEffect(() => {
    navigateToRoomRef.current = navigateToRoom;
  }, [navigateToRoom]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    registerChatBackgroundTask();
  }, []);

  const handledNotificationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      // 콜드스타트 경로와 리스너 경로에서 같은 알림이 두 번 처리되지 않도록 방어
      const id = response.notification.request.identifier;
      if (id) {
        if (handledNotificationIdsRef.current.has(id)) return;
        handledNotificationIdsRef.current.add(id);
      }

      const data = response.notification.request.content.data as {
        alertType?: AlertType;
        sourceId?: number;
        roomId?: number;
      };
      if (data?.alertType === AlertType.CHTTING_REQUEST && data?.sourceId != null) {
        navigateToChatRef.current(data.sourceId);
      } else if (data?.roomId != null) {
        navigateToRoomRef.current(data.roomId);
      } else if (data?.alertType === AlertType.TRADE_COMPLETE && data?.sourceId != null) {
        routerRef.current.push(`/post/${data.sourceId}?review=1`);
      } else if (data?.alertType === AlertType.REVIEW && data?.sourceId != null) {
        routerRef.current.push(`/cancelTrade/${data.sourceId}`);
      }
    };

    // 앱이 종료된 상태에서 알림을 눌러 실행된 경우 리스너가 놓치므로 마지막 응답을 확인
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch(() => {});

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();
  const isConnected = useNetworkStatus();
  const pathname = usePathname();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <View className="flex-1 bg-white">
          <StatusBar style="dark" />
          <QueryProvider>
            <ChatNotificationHandler />
            <SentryRN.ErrorBoundary fallback={<></>}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}>
                {/* 하단 탭 전환은 (tabs) 레이아웃의 sceneStyleInterpolator가 전담하므로
                  네이티브 트랜지션은 끄고 중복 애니메이션을 방지한다. */}
                <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                {/* 로그인(별칭 → 비밀번호) 화면은 SigninPage 내부의 SlideFadeTransition이
                  푸터 탭 전환과 동일한 애니메이션을 전담하므로, 네이티브 트랜지션은 끄고
                  중복 애니메이션을 방지한다. */}
                <Stack.Screen name="signin" options={{ animation: 'none' }} />
              </Stack>
            </SentryRN.ErrorBoundary>
            <BottomSheetPortalOutlet />
            <Toast config={toastConfig} topOffset={Platform.select({ ios: 70, default: 40 })} />
            <NoNetworkOverlay visible={!isConnected} />
          </QueryProvider>
        </View>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
