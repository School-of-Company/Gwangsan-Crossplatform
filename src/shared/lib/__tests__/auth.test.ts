import { getData } from '../getData';
import { removeData } from '../removeData';
import { getAccessToken, getRefreshToken, clearAuthTokens } from '../auth';
import * as Keychain from 'react-native-keychain';
import * as Notifications from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
}));

jest.mock('../getData', () => ({
  getData: jest.fn(),
}));

jest.mock('../removeData', () => ({
  removeData: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

const mockGetData = getData as jest.MockedFunction<typeof getData>;
const mockRemoveData = removeData as jest.MockedFunction<typeof removeData>;
const mockResetGenericPassword = Keychain.resetGenericPassword as jest.MockedFunction<
  typeof Keychain.resetGenericPassword
>;

// auth.ts는 모듈 로드 시점(최초 import)에 setNotificationHandler를 한 번 호출한다.
// beforeEach의 jest.clearAllMocks()가 호출 기록을 지우기 전에 미리 캡처해둔다.
const notificationHandlerConfig = (Notifications.setNotificationHandler as jest.Mock).mock
  .calls[0][0];

describe('auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('알림 핸들러 설정', () => {
    it('handleNotification 콜백이 알림 표시 설정을 반환한다', async () => {
      const result = await notificationHandlerConfig.handleNotification();

      expect(result).toEqual({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      });
    });
  });

  describe('getAccessToken', () => {
    it('스토리지에서 accessToken을 읽어 반환한다', async () => {
      mockGetData.mockResolvedValue('test-access-token');

      const result = await getAccessToken();

      expect(mockGetData).toHaveBeenCalledWith('accessToken');
      expect(result).toBe('test-access-token');
    });

    it('저장된 토큰이 없으면 null을 반환한다', async () => {
      mockGetData.mockResolvedValue(null);

      const result = await getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('스토리지에서 refreshToken을 읽어 반환한다', async () => {
      mockGetData.mockResolvedValue('test-refresh-token');

      const result = await getRefreshToken();

      expect(mockGetData).toHaveBeenCalledWith('refreshToken');
      expect(result).toBe('test-refresh-token');
    });

    it('저장된 토큰이 없으면 null을 반환한다', async () => {
      mockGetData.mockResolvedValue(null);

      const result = await getRefreshToken();

      expect(result).toBeNull();
    });
  });

  describe('clearAuthTokens', () => {
    it('accessToken, refreshToken, Keychain 자격증명을 병렬로 삭제한다', async () => {
      mockRemoveData.mockResolvedValue(undefined);
      mockResetGenericPassword.mockResolvedValue(true);

      await clearAuthTokens();

      expect(mockRemoveData).toHaveBeenCalledTimes(2);
      expect(mockRemoveData).toHaveBeenCalledWith('accessToken');
      expect(mockRemoveData).toHaveBeenCalledWith('refreshToken');
      expect(mockResetGenericPassword).toHaveBeenCalledTimes(1);
    });

    it('Keychain 삭제 실패 시에도 에러를 전파하지 않는다', async () => {
      mockRemoveData.mockResolvedValue(undefined);
      mockResetGenericPassword.mockRejectedValue(new Error('Keychain error'));

      await expect(clearAuthTokens()).resolves.toBeUndefined();
    });

    it('removeData가 실패해도 에러를 전파하지 않는다', async () => {
      mockRemoveData.mockRejectedValue(new Error('Storage error'));

      await expect(clearAuthTokens()).resolves.toBeUndefined();
    });
  });
});
