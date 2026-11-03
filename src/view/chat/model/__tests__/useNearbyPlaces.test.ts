import { act, renderHook } from '@testing-library/react-native';
import { getAddressName, searchNearbyPlaces } from '~/shared/api/kakaoLocalSearch';
import { useNearbyPlaces, NEARBY_DEBOUNCE_MS, NEARBY_RESULT_COUNT } from '../useNearbyPlaces';

jest.mock('~/shared/api/kakaoLocalSearch', () => ({
  searchNearbyPlaces: jest.fn(),
  getAddressName: jest.fn(),
}));
jest.mock('~/shared/lib/logger', () => ({ logger: { error: jest.fn() } }));

const mockSearchNearbyPlaces = searchNearbyPlaces as jest.Mock;
const mockGetAddressName = getAddressName as jest.Mock;

const COORD = { latitude: 35.1, longitude: 126.8 };
const place = (id: string) => ({
  id,
  place_name: id,
  road_address_name: `도로명 ${id}`,
  address_name: `지번 ${id}`,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchNearbyPlaces.mockResolvedValue([place('a'), place('b'), place('c'), place('d')]);
  mockGetAddressName.mockResolvedValue('광주 광산구');
});

describe('useNearbyPlaces', () => {
  it('주변 장소를 정해진 개수만 남기고 주소와 함께 돌려준다', async () => {
    const { result } = renderHook(() => useNearbyPlaces());

    await act(async () => {
      await result.current.fetchNearbyPlaces(COORD);
    });

    expect(result.current.nearbyPlaces).toHaveLength(NEARBY_RESULT_COUNT);
    expect(result.current.currentAddress).toBe('광주 광산구');
    expect(result.current.hasLoadedNearbyOnce).toBe(true);
    expect(result.current.getLastFetchedCoordinate()).toEqual(COORD);
  });

  it('같은 좌표로 다시 부르면 조회하지 않는다', async () => {
    const { result } = renderHook(() => useNearbyPlaces());

    await act(async () => {
      await result.current.fetchNearbyPlaces(COORD);
      await result.current.fetchNearbyPlaces({ ...COORD });
    });

    expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(1);
  });

  it('주소 조회가 비면 가장 가까운 장소의 주소로 대체한다', async () => {
    mockGetAddressName.mockResolvedValue('');
    const { result } = renderHook(() => useNearbyPlaces());

    await act(async () => {
      await result.current.fetchNearbyPlaces(COORD);
    });

    expect(result.current.currentAddress).toBe('도로명 a');
  });

  it('지도 이동은 멈춘 뒤 한 번만 조회한다', async () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useNearbyPlaces());

      act(() => {
        result.current.scheduleFetchNearbyPlaces({ latitude: 1, longitude: 1 });
        result.current.scheduleFetchNearbyPlaces({ latitude: 2, longitude: 2 });
      });
      await act(async () => {
        jest.advanceTimersByTime(NEARBY_DEBOUNCE_MS);
      });

      expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(1);
      expect(mockSearchNearbyPlaces).toHaveBeenCalledWith({ latitude: 2, longitude: 2 }, 1000);
    } finally {
      jest.useRealTimers();
    }
  });

  it('조회가 실패하면 목록과 주소를 비운다', async () => {
    mockSearchNearbyPlaces.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useNearbyPlaces());

    await act(async () => {
      await result.current.fetchNearbyPlaces(COORD);
    });

    expect(result.current.nearbyPlaces).toEqual([]);
    expect(result.current.currentAddress).toBe('');
    expect(result.current.isLoadingNearby).toBe(false);
  });
});
