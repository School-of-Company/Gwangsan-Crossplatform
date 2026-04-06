import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { getData } from '@/shared/lib/getData';
import { setData } from '@/shared/lib/setData';
import { getDeviceInfo } from '../getDeviceInfo';

// babel-jest hoists variables starting with 'mock', so this is safe to use in jest.mock factories
let mockIsDevice = true;

jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice;
  },
  getDeviceTypeAsync: jest.fn(),
  brand: 'Apple',
  modelName: 'iPhone14',
  osVersion: '16.0',
  osInternalBuildId: 'build123',
  modelId: 'iPhone14,3',
}));

jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: { projectId: 'test-project-id' },
        apiUrl: 'http://test-api.com',
      },
    },
    easConfig: { projectId: 'eas-project-id' },
  },
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

jest.mock('@/shared/lib/getData', () => ({
  getData: jest.fn(),
}));

jest.mock('@/shared/lib/setData', () => ({
  setData: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({ show: jest.fn() }));

const mockNotifications = jest.mocked(Notifications);
const mockSentry = jest.mocked(Sentry);
const mockGetData = jest.mocked(getData);
const mockSetData = jest.mocked(setData);

const grantedPermission = { status: 'granted' } as Awaited<
  ReturnType<typeof Notifications.getPermissionsAsync>
>;
const deniedPermission = { status: 'denied' } as Awaited<
  ReturnType<typeof Notifications.getPermissionsAsync>
>;

afterEach(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockIsDevice = true;
  (Platform as any).OS = 'ios';

  mockNotifications.getPermissionsAsync.mockResolvedValue(grantedPermission);
  mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
    data: 'ExponentPushToken[test]',
  } as any);
  mockGetData.mockResolvedValue('saved-device-id');
  mockSetData.mockResolvedValue(undefined);
  (jest.requireMock('expo-device') as any).getDeviceTypeAsync = jest.fn().mockResolvedValue(1);
});

describe('getDeviceInfo', () => {
  it('iOS에서 deviceToken, deviceId, osType을 반환한다', async () => {
    const result = await getDeviceInfo();

    expect(result).toEqual({
      osType: 'IOS',
      deviceToken: 'ExponentPushToken[test]',
      deviceId: 'saved-device-id',
    });
  });

  it('Android에서 osType이 ANDROID이다', async () => {
    (Platform as any).OS = 'android';
    mockNotifications.setNotificationChannelAsync.mockResolvedValue(null as any);

    const result = await getDeviceInfo();

    expect(result.osType).toBe('ANDROID');
    expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ name: 'default' })
    );
  });

  it('시뮬레이터(isDevice=false)면 simulator-mock-token을 반환한다', async () => {
    mockIsDevice = false;

    const result = await getDeviceInfo();

    expect(result.deviceToken).toBe('simulator-mock-token');
    expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('알림 권한이 없으면 requestPermissionsAsync를 호출한다', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue(deniedPermission);
    mockNotifications.requestPermissionsAsync.mockResolvedValue(grantedPermission);

    await getDeviceInfo();

    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('권한 요청 후에도 거부되면 에러를 throw한다', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue(deniedPermission);
    mockNotifications.requestPermissionsAsync.mockResolvedValue(deniedPermission);

    await expect(getDeviceInfo()).rejects.toThrow(
      '로그인하려면 푸시 알림 권한이 필요합니다. 설정에서 알림을 허용해주세요.'
    );
  });

  it('getExpoPushTokenAsync 실패 시 Sentry에 캡처하고 에러를 throw한다', async () => {
    const tokenError = new Error('Token fetch failed');
    mockNotifications.getExpoPushTokenAsync.mockRejectedValue(tokenError);

    await expect(getDeviceInfo()).rejects.toThrow('Token fetch failed');
    expect(mockSentry.captureException).toHaveBeenCalledWith(
      tokenError,
      expect.objectContaining({
        extra: expect.objectContaining({ context: 'registerForPushNotificationsAsync' }),
      })
    );
  });

  it('getExpoPushTokenAsync가 15초 내에 응답 없으면 timeout 에러를 throw한다', async () => {
    jest.useFakeTimers();
    mockNotifications.getExpoPushTokenAsync.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    // Attach rejection handler before advancing timers to prevent unhandled rejection
    const assertion = expect(getDeviceInfo()).rejects.toThrow('getExpoPushTokenAsync timeout');
    await jest.runAllTimersAsync();
    await assertion;

    jest.useRealTimers();
  });

  it('deviceToken이 빈 문자열이면 에러를 throw한다', async () => {
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: '' } as any);

    await expect(getDeviceInfo()).rejects.toThrow('푸시 알림 권한이 필요합니다');
  });
});

describe('generateDeviceId (via getDeviceInfo)', () => {
  it('저장된 deviceId가 있으면 새로 생성하지 않는다', async () => {
    mockGetData.mockResolvedValue('existing-id');

    await getDeviceInfo();

    expect(mockSetData).not.toHaveBeenCalledWith('deviceId', expect.anything());
  });

  it('저장된 deviceId가 없으면 기기 정보로 새 ID를 생성하고 저장한다', async () => {
    mockGetData.mockResolvedValue(null);

    await getDeviceInfo();

    expect(mockSetData).toHaveBeenCalledWith('deviceId', expect.any(String));
  });

  it('deviceId 생성 중 에러가 발생하면 랜덤 ID를 저장하고 반환한다', async () => {
    mockGetData.mockRejectedValue(new Error('Storage error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getDeviceInfo();

    expect(result.deviceId).toBeTruthy();
    expect(mockSetData).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
