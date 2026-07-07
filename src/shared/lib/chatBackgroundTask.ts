import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { baseURL } from '@/shared/lib/axios';
import { logger } from '@/shared/lib/logger';
import type { ChatRoomListItem } from '@/entity/chat/model/chatTypes';

export const CHAT_BACKGROUND_TASK = 'chat-background-fetch';
const LAST_UNREAD_KEY = 'chatLastUnreadState';

// Expo 규격: defineTask는 반드시 모듈 최상위에서 동기적으로 호출해야 합니다.
TaskManager.defineTask(CHAT_BACKGROUND_TASK, async () => {
  try {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!accessToken) return BackgroundFetch.BackgroundFetchResult.NoData;

    const response = await fetch(`${baseURL}/chat/rooms`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return BackgroundFetch.BackgroundFetchResult.Failed;

    const rooms: ChatRoomListItem[] = await response.json();
    const unreadRooms = rooms.filter((r) => r.unreadMessageCount > 0);

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

    const newUnreadRooms = unreadRooms.filter((room) => {
      const prevCount = lastState[String(room.roomId)] ?? 0;
      return room.unreadMessageCount > prevCount;
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
  } catch {
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

    const isRegistered = await TaskManager.isTaskRegisteredAsync(CHAT_BACKGROUND_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(CHAT_BACKGROUND_TASK, {
        minimumInterval: 60 * 5,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
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
