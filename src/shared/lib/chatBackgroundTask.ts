import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError } from 'axios';
import * as Sentry from '@sentry/react-native';
import { publicInstance } from '~/shared/lib/publicInstance';
import { logger } from '~/shared/lib/logger';
import { MESSAGE_TYPE, type ChatRoomListItem } from '~/shared/types/chatType';
import { getData } from './getData';
import { isNetworkOrTimeoutError } from './errorHandler';

export const CHAT_BACKGROUND_TASK = 'chat-background-fetch';
const LAST_UNREAD_KEY = 'chatLastUnreadState';

// 백그라운드 실행 결과는 화면에 드러나지 않으므로 실패 이유를 breadcrumb으로 남겨, 이후 Sentry 이벤트에서
// 실제로 동작했는지 확인할 수 있게 한다. 토큰 값은 남기지 않는다
const recordFailure = (reason: string, data?: Record<string, unknown>) => {
  Sentry.addBreadcrumb({
    category: 'chat-background',
    message: `Chat background fetch skipped: ${reason}`,
    level: 'warning',
    data,
  });
};

const describeRequestFailure = (error: unknown): string => {
  if (error instanceof AxiosError && error.response?.status === 401) return 'unauthorized';
  if (isNetworkOrTimeoutError(error)) return 'network or timeout';
  return 'request failed';
};

// Expo 규격: defineTask는 반드시 모듈 최상위에서 동기적으로 호출해야 합니다.
TaskManager.defineTask(CHAT_BACKGROUND_TASK, async () => {
  try {
    let accessToken: string | null;
    try {
      accessToken = await getData('accessToken');
    } catch {
      recordFailure('token storage unavailable');
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    if (!accessToken) return BackgroundFetch.BackgroundFetchResult.NoData;

    // 백그라운드에서는 토큰 재발급·강제 로그아웃(화면 이동)이 일어나면 안 되므로 인터셉터가 없는
    // 공용 인스턴스에 토큰만 직접 붙인다. 재발급하면 포그라운드의 재발급과 같은 refresh token을 동시에
    // 써서 교체된 토큰이 어긋날 수 있으므로, 401이면 다음 포그라운드 실행에 맡기고 끝낸다
    let rooms: ChatRoomListItem[];
    try {
      const { data } = await publicInstance.get<ChatRoomListItem[]>('/chat/rooms', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      rooms = data;
    } catch (error) {
      recordFailure(describeRequestFailure(error), {
        status: error instanceof AxiosError ? error.response?.status : undefined,
      });
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    const unreadRooms = rooms.filter((r) => r.unreadMessageCount > 0);
    const totalUnread = rooms.reduce((sum, r) => sum + (r.unreadMessageCount ?? 0), 0);
    await Notifications.setBadgeCountAsync(totalUnread).catch(() => {});

    if (unreadRooms.length === 0) {
      await AsyncStorage.setItem(LAST_UNREAD_KEY, JSON.stringify({}));
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const lastStateRaw = await AsyncStorage.getItem(LAST_UNREAD_KEY);
    const isFirstRun = lastStateRaw === null;
    let lastState: Record<string, number> = {};
    try {
      lastState = lastStateRaw ? JSON.parse(lastStateRaw) : {};
    } catch {
      await AsyncStorage.removeItem(LAST_UNREAD_KEY).catch(() => {});
    }

    if (isFirstRun) {
      const newState: Record<string, number> = {};
      for (const room of rooms) {
        newState[String(room.roomId)] = room.unreadMessageCount;
      }
      await AsyncStorage.setItem(LAST_UNREAD_KEY, JSON.stringify(newState));
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // 마지막 메시지가 SYSTEM(예약 취소 안내 등)이면 서버가 이미 푸시를 보냈으므로 로컬 알림을 띄우지 않는다
    const newUnreadRooms = unreadRooms.filter((room) => {
      const prevCount = lastState[String(room.roomId)] ?? 0;
      return room.unreadMessageCount > prevCount && room.lastMessageType !== MESSAGE_TYPE.SYSTEM;
    });

    await Promise.all(
      newUnreadRooms.map((room) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: room.member?.nickname ?? '새로운 메시지',
            body:
              room.lastMessageType === 'IMAGE' ? '사진을 보냈습니다.' : (room.lastMessage ?? ''),
            data: { roomId: room.roomId },
          },
          trigger: null,
        })
      )
    );

    const newState: Record<string, number> = {};
    for (const room of rooms) {
      newState[String(room.roomId)] = room.unreadMessageCount;
    }
    await AsyncStorage.setItem(LAST_UNREAD_KEY, JSON.stringify(newState));

    return newUnreadRooms.length > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    recordFailure('unexpected error', {
      name: error instanceof Error ? error.name : typeof error,
    });
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerChatBackgroundTask = async (): Promise<void> => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    // 시뮬레이터(Restricted) 또는 권한 거부(Denied) 시 등록하지 않음
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    // isTaskRegisteredAsync는 네이티브에 영구 저장된 등록 플래그만 확인하며 실제 알람
    // 생존 여부와 무관하다. 앱 재시작 등으로 알람이 죽어도 플래그는 true로 남아
    // 재등록을 건너뛰게 되므로, 매번 호출해 알람을 다시 세팅한다(재호출은 안전함).
    await BackgroundFetch.registerTaskAsync(CHAT_BACKGROUND_TASK, {
      minimumInterval: 60 * 5,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    // 미지원 환경(Expo Go 등)에서는 등록이 실패할 수 있으나,
    // 실기기 빌드에서의 실패는 백그라운드 알림 전체가 죽는 문제라 추적이 필요하다.
    logger.warn('Background fetch 등록 실패 — 백그라운드 채팅 알림이 동작하지 않습니다', error);
    Sentry.captureException(error, {
      extra: { context: 'registerChatBackgroundTask' },
    });
  }
};

export const unregisterChatBackgroundTask = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(CHAT_BACKGROUND_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(CHAT_BACKGROUND_TASK);
    }
  } catch {
    // ignore
  }
};

// 로그아웃 시 다음 로그인 계정에 이전 계정의 미확인 상태가 새지 않도록 초기화합니다.
export const clearChatUnreadState = async (): Promise<void> => {
  await AsyncStorage.removeItem(LAST_UNREAD_KEY).catch(() => {});
};
