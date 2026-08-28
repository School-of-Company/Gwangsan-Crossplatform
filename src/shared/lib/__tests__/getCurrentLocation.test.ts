import * as Location from 'expo-location';
import { getCurrentLocation } from '../getCurrentLocation';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const mockRequestPermission = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockGetPosition = Location.getCurrentPositionAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getCurrentLocation', () => {
  it('권한이 허용되면 현재 좌표를 반환한다', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 35.15, longitude: 126.85 } });

    const result = await getCurrentLocation();

    expect(result).toEqual({ latitude: 35.15, longitude: 126.85 });
  });

  it('권한이 거부되면 에러를 throw한다', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });

    await expect(getCurrentLocation()).rejects.toThrow('위치 권한이 필요합니다.');
    expect(mockGetPosition).not.toHaveBeenCalled();
  });
});
