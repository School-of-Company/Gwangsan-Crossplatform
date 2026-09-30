import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useMemo, useRef } from 'react';
import { z } from 'zod';
import { saveE2ECoverage } from '@/shared/lib/e2eCoverage';
import '../../global.css';
import { useCustomFonts } from '@/shared/assets/fonts/fontLoader';
import { ToastStack } from '@/shared/ui/Toast/ToastStack';
import QueryProvider from '../shared/lib/QueryProvider';
import '@/shared/lib/sentry';
import * as SentryRN from '@sentry/react-native';
import { useNetworkStatus } from '@/shared/lib/useNetworkStatus';
import { NoNetworkOverlay } from '@/shared/ui/NoNetworkOverlay';
import { BottomSheetPortalOutlet } from '@/shared/ui/BottomSheetPortalOutlet';
import { RootErrorBoundary } from '@/shared/ui/RootErrorBoundary';
import * as Notifications from 'expo-notifications';
import { AlertType } from '@/entity/notification';
import { useChatEntry } from '@/entity/chat/model/useChatEntry';
import { useGlobalChatNotifications } from '@/entity/chat/model/useGlobalChatNotifications';
import { registerChatBackgroundTask } from '@/shared/lib/chatBackgroundTask';
import { useThemeColors } from '@/shared/lib/theme';

// 알림 페이로드는 푸시 서버/OS를 거쳐 들어오는 신뢰할 수 없는 외부 입력이므로, 라우팅에
// 쓰기 전에 형태와 범위를 검증한다. 잘못되거나 조작된 sourceId/roomId가 그대로
// router.push의 경로 세그먼트로 흘러들어가지 않도록 막는다.
const notificationDataSchema = z.object({
  alertType: z.nativeEnum(AlertType).optional(),
  sourceId: z.coerce.number().int().positive().optional(),
  roomId: z.coerce.number().int().positive().optional(),
});

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

      const parsedData = notificationDataSchema.safeParse(
        response.notification.request.content.data
      );
      if (!parsedData.success) return;
      const data = parsedData.data;

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
  const themeColors = useThemeColors();

  // 네비게이션 화면(Stack/Tabs)의 기본 배경도 시스템 테마를 따르게 해서, 화면 전환 중에
  // 흰 배경이 비치지 않도록 한다
  const navigationTheme = useMemo(() => {
    const base = themeColors.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: themeColors.background,
        card: themeColors.surface,
        text: themeColors.foreground,
        border: themeColors['gray-200'],
        primary: themeColors.main,
      },
    };
  }, [themeColors]);

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
        <View className="flex-1 bg-background">
          <StatusBar style="auto" />
          <ThemeProvider value={navigationTheme}>
            <QueryProvider>
              {/* 알림 핸들러도 렌더 중 에러가 나면 앱 전체가 죽지 않도록 바운더리 안에 둔다(#740) */}
              <RootErrorBoundary>
                <ChatNotificationHandler />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    // A→B로 이동하면 오른쪽에서 슬라이드해 들어오고, B에서 다시 A로 뒤로가면
                    // 반대로(오른쪽으로 빠져나가며) 되돌아간다 — 네이티브 스택 트랜지션이라
                    // pop 시 자동으로 반대 방향이 적용된다. 모든 페이지(Stack.Screen)에 공통
                    // 적용되므로 화면마다 애니메이션이 서로 달라지는 문제가 없다.
                    animation: 'slide_from_right',
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                  }}>
                  {/* 후기 작성 화면의 밝기 슬라이더가 화면 전체 폭을 가로질러 드래그되는데,
                  스와이프-뒤로가기 제스처가 이 드래그와 같은 터치로 인식되어 화면이 함께
                  뒤로 넘어가 버린다. 이 화면에서는 제스처 자체를 꺼서 충돌을 없앤다. */}
                  <Stack.Screen name="chatting/[id]/review" options={{ gestureEnabled: false }} />
                </Stack>
              </RootErrorBoundary>
              <BottomSheetPortalOutlet />
              <ToastStack topOffset={Platform.select({ ios: 70, default: 40 })} />
              <NoNetworkOverlay visible={!isConnected} />
            </QueryProvider>
          </ThemeProvider>
        </View>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
