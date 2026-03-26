import { getData } from '../getData';
import { removeData } from '../removeData';
import { getAccessToken, getRefreshToken, clearAuthTokens } from '../auth';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
}));

jest.mock('../getData', () => ({
  getData: jest.fn(),
}));

jest.mock('../removeData', () => ({
  removeData: jest.fn(),
}));

const mockGetData = getData as jest.MockedFunction<typeof getData>;
const mockRemoveData = removeData as jest.MockedFunction<typeof removeData>;

describe('auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    it('accessToken과 refreshToken을 병렬로 삭제한다', async () => {
      mockRemoveData.mockResolvedValue(undefined);

      await clearAuthTokens();

      expect(mockRemoveData).toHaveBeenCalledTimes(2);
      expect(mockRemoveData).toHaveBeenCalledWith('accessToken');
      expect(mockRemoveData).toHaveBeenCalledWith('refreshToken');
    });

    it('removeData가 실패하면 에러를 전파한다', async () => {
      mockRemoveData.mockRejectedValue(new Error('Storage error'));

      await expect(clearAuthTokens()).rejects.toThrow('Storage error');
    });
  });
});
