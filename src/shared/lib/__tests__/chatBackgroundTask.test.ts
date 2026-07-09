import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CHAT_BACKGROUND_TASK,
  registerChatBackgroundTask,
  unregisterChatBackgroundTask,
} from '../chatBackgroundTask';

jest.mock('expo-background-fetch', () => ({
  BackgroundFetchResult: { NoData: 'NoData', Failed: 'Failed', NewData: 'NewData' },
  BackgroundFetchStatus: { Denied: 'Denied', Restricted: 'Restricted', Available: 'Available' },
  getStatusAsync: jest.fn(),
  registerTaskAsync: jest.fn(),
  unregisterTaskAsync: jest.fn(),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/shared/lib/axios', () => ({ baseURL: 'https://api.test.com/api' }));

const mockDefineTask = TaskManager.defineTask as jest.Mock;
const mockIsTaskRegisteredAsync = TaskManager.isTaskRegisteredAsync as jest.Mock;
const mockGetStatusAsync = BackgroundFetch.getStatusAsync as jest.Mock;
const mockRegisterTaskAsync = BackgroundFetch.registerTaskAsync as jest.Mock;
const mockUnregisterTaskAsync = BackgroundFetch.unregisterTaskAsync as jest.Mock;
const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockScheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const mockSetBadgeCountAsync = Notifications.setBadgeCountAsync as jest.Mock;
const mockAsyncGetItem = AsyncStorage.getItem as jest.Mock;
const mockAsyncSetItem = AsyncStorage.setItem as jest.Mock;
const mockAsyncRemoveItem = AsyncStorage.removeItem as jest.Mock;

// TaskManager.defineTask is called synchronously at module import time, so the
// registered handler must be captured immediately, before any beforeEach clears it.
const defineTaskCall = mockDefineTask.mock.calls[0];
const taskHandler = defineTaskCall[1] as () => Promise<unknown>;

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn() as any;
  mockAsyncGetItem.mockResolvedValue(null);
  mockAsyncSetItem.mockResolvedValue(undefined);
  mockAsyncRemoveItem.mockResolvedValue(undefined);
  mockScheduleNotificationAsync.mockResolvedValue(undefined);
  mockSetBadgeCountAsync.mockResolvedValue(undefined);
  mockGetItemAsync.mockResolvedValue(null);
});

afterAll(() => {
  global.fetch = originalFetch;
});

function mockFetchResponse(ok: boolean, rooms: unknown[] = []) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(rooms),
  });
}

describe('CHAT_BACKGROUND_TASK handler', () => {
  it('is registered with the correct task name', () => {
    expect(defineTaskCall[0]).toBe(CHAT_BACKGROUND_TASK);
    expect(typeof taskHandler).toBe('function');
    expect(CHAT_BACKGROUND_TASK).toBe('chat-background-fetch');
  });

  it('returns NoData without fetching when there is no access token', async () => {
    mockGetItemAsync.mockResolvedValue(null);

    const result = await taskHandler();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);
  });

  it('returns Failed when the fetch response is not ok', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockFetchResponse(false);

    const result = await taskHandler();

    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.Failed);
  });

  it('resets stored state and returns NoData when there are no unread rooms', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockFetchResponse(true, [{ roomId: 1, unreadMessageCount: 0 }]);

    const result = await taskHandler();

    expect(mockAsyncSetItem).toHaveBeenCalledWith('chatLastUnreadState', JSON.stringify({}));
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);
  });

  it('on the first run (no stored state) saves state without notifying', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockAsyncGetItem.mockResolvedValue(null);
    mockFetchResponse(true, [
      {
        roomId: 1,
        unreadMessageCount: 2,
        member: { nickname: 'A' },
        lastMessageType: 'TEXT',
        lastMessage: 'hi',
      },
    ]);

    const result = await taskHandler();

    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockAsyncSetItem).toHaveBeenCalledWith(
      'chatLastUnreadState',
      JSON.stringify({ '1': 2 })
    );
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);
  });

  it('notifies only rooms whose unread count increased and returns NewData', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockAsyncGetItem.mockResolvedValue(JSON.stringify({ '1': 1, '2': 3 }));
    mockFetchResponse(true, [
      {
        roomId: 1,
        unreadMessageCount: 2,
        member: { nickname: 'A' },
        lastMessageType: 'TEXT',
        lastMessage: '새 메시지',
      },
      {
        roomId: 2,
        unreadMessageCount: 3,
        member: { nickname: 'B' },
        lastMessageType: 'TEXT',
        lastMessage: '변화없음',
      },
    ]);

    const result = await taskHandler();

    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'A', body: '새 메시지', data: { roomId: 1 } },
      trigger: null,
    });
    expect(mockAsyncSetItem).toHaveBeenCalledWith(
      'chatLastUnreadState',
      JSON.stringify({ '1': 2, '2': 3 })
    );
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NewData);
  });

  it('shows an image placeholder body for IMAGE messages', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockAsyncGetItem.mockResolvedValue(JSON.stringify({ '1': 0 }));
    mockFetchResponse(true, [
      {
        roomId: 1,
        unreadMessageCount: 1,
        member: { nickname: 'A' },
        lastMessageType: 'IMAGE',
        lastMessage: null,
      },
    ]);

    await taskHandler();

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ body: '사진을 보냈습니다.' }) })
    );
  });

  it('falls back to a default title when the room has no member nickname', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockAsyncGetItem.mockResolvedValue(JSON.stringify({}));
    mockFetchResponse(true, [
      {
        roomId: 1,
        unreadMessageCount: 1,
        member: undefined,
        lastMessageType: 'TEXT',
        lastMessage: '메시지',
      },
    ]);

    await taskHandler();

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ title: '새로운 메시지' }) })
    );
  });

  it('returns NoData without notifying when no room increased its unread count', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockAsyncGetItem.mockResolvedValue(JSON.stringify({ '1': 5 }));
    mockFetchResponse(true, [
      {
        roomId: 1,
        unreadMessageCount: 5,
        member: { nickname: 'A' },
        lastMessageType: 'TEXT',
        lastMessage: 'x',
      },
    ]);

    const result = await taskHandler();

    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);
  });

  it('clears storage and continues when stored state fails to parse', async () => {
    mockGetItemAsync.mockResolvedValue('token');
    mockAsyncGetItem.mockResolvedValue('not-json{{{');
    mockFetchResponse(true, [
      {
        roomId: 1,
        unreadMessageCount: 1,
        member: { nickname: 'A' },
        lastMessageType: 'TEXT',
        lastMessage: 'hi',
      },
    ]);

    const result = await taskHandler();

    expect(mockAsyncRemoveItem).toHaveBeenCalledWith('chatLastUnreadState');
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NewData);
  });

  it('returns Failed when an unexpected error is thrown', async () => {
    mockGetItemAsync.mockRejectedValue(new Error('boom'));

    const result = await taskHandler();

    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.Failed);
  });
});

describe('registerChatBackgroundTask', () => {
  it('does not register when the status is Restricted', async () => {
    mockGetStatusAsync.mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Restricted);

    await registerChatBackgroundTask();

    expect(mockIsTaskRegisteredAsync).not.toHaveBeenCalled();
    expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
  });

  it('does not register when the status is Denied', async () => {
    mockGetStatusAsync.mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Denied);

    await registerChatBackgroundTask();

    expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
  });

  it('registers the task when available', async () => {
    mockGetStatusAsync.mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Available);

    await registerChatBackgroundTask();

    expect(mockRegisterTaskAsync).toHaveBeenCalledWith(
      CHAT_BACKGROUND_TASK,
      expect.objectContaining({
        minimumInterval: 60 * 5,
        stopOnTerminate: false,
        startOnBoot: true,
      })
    );
  });

  it('re-registers even when the native flag already reports it as registered', async () => {
    // isTaskRegisteredAsync only reflects a persisted native flag, not whether the alarm
    // actually survived a process restart, so registration always re-runs (safe to repeat).
    mockGetStatusAsync.mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Available);
    mockIsTaskRegisteredAsync.mockResolvedValue(true);

    await registerChatBackgroundTask();

    expect(mockRegisterTaskAsync).toHaveBeenCalledWith(
      CHAT_BACKGROUND_TASK,
      expect.objectContaining({
        minimumInterval: 60 * 5,
        stopOnTerminate: false,
        startOnBoot: true,
      })
    );
  });

  it('silently ignores unexpected errors', async () => {
    mockGetStatusAsync.mockRejectedValue(new Error('fail'));

    await expect(registerChatBackgroundTask()).resolves.toBeUndefined();
  });
});

describe('unregisterChatBackgroundTask', () => {
  it('unregisters when the task is registered', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(true);

    await unregisterChatBackgroundTask();

    expect(mockUnregisterTaskAsync).toHaveBeenCalledWith(CHAT_BACKGROUND_TASK);
  });

  it('does nothing when the task is not registered', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(false);

    await unregisterChatBackgroundTask();

    expect(mockUnregisterTaskAsync).not.toHaveBeenCalled();
  });

  it('silently ignores unexpected errors', async () => {
    mockIsTaskRegisteredAsync.mockRejectedValue(new Error('fail'));

    await expect(unregisterChatBackgroundTask()).resolves.toBeUndefined();
  });
});
